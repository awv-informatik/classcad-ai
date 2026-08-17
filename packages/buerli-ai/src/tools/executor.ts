// ─── Tool executor — dispatches tool calls to their handlers ──────────────────

import { createApi, BuerliCadFacade } from '@buerli.io/classcad'
import { getDrawing } from '@buerli.io/core'
import type { ToolExecutorContext, ToolHandler, ToolResult } from '../types'
import { getMethodRegistry, type MethodRegistry } from './registry'
import { getDiscovery } from './discovery'
import { describeMethod, readDoc } from './skill'
import { renderSessionData, applyAdaptiveFaceting } from '@classcad/renderer'
import { entryToPngBase64 } from '@classcad/renderer/browser'
import { browserSession, drawingUsedSolidApi } from './session'
import { API_EXTRAS } from './apiExtras'
import { toErrorMessage, base64ToArrayBuffer, extractBase64 } from './utils'
import { runScriptHandler } from './script'
import { checkpoint, restore } from './checkpoint'
import { notes } from './notes'

// API namespaces the agent can reach (the first path segment selects one):
//   v1       — ClassCAD command API (createApi(id).v1; single object arg; documented).
//   facade   — BuerliCadFacade session/history utils (undo/redo/fetchTree/…). The
//              current drawing id is auto-injected, so the model passes only extras.
//   <other>  — any buerli drawing operation API on getDrawing(id).api.* (structure,
//              interaction, selection, geometry, …); POSITIONAL args.
// v0 (legacy ClassCAD) is intentionally NOT exposed — use v1.
function resolveNamespace(drawingId: ToolExecutorContext['drawingId'], ns: string): any {
  if (ns === 'v1') return (createApi(drawingId) as any)?.v1
  if (ns === 'facade') return (BuerliCadFacade as any)?.utils
  return (getDrawing(drawingId) as any)?.api?.[ns]
}

// A namespace is callable if it resolves to an object on this drawing.
function isCallableNamespace(drawingId: ToolExecutorContext['drawingId'], ns: string): boolean {
  const root = resolveNamespace(drawingId, ns)
  return root != null && typeof root === 'object'
}

// All namespaces currently reachable on this drawing (for list_methods discovery).
// Only object-valued keys are real namespaces — they're what `call_api` reaches via
// "<namespace>.<method>" and what isCallableNamespace accepts. Function-valued keys
// (e.g. api.reset()) aren't callable that way, so listing them as namespaces would
// contradict isCallableNamespace and make `list_methods({ namespace })` reject them.
function listNamespaces(drawingId: ToolExecutorContext['drawingId']): string[] {
  const api = (getDrawing(drawingId) as any)?.api ?? {}
  const dynamic = Object.keys(api).filter(k => api[k] != null && typeof api[k] === 'object')
  return ['v1', 'facade', ...dynamic]
}

// Walk a dotted path on a root, returning the function and the object that owns
// it (so we can preserve `this` when invoking class-instance methods).
function resolveCallable(root: any, path: string[]): { fn: any; owner: any } {
  let owner = root
  let fn = root
  for (const seg of path) {
    owner = fn
    fn = fn?.[seg]
  }
  return { fn, owner }
}

// Reflect callable method names off a live API object, walking the prototype
// chain (buerli sub-APIs are class instances, so methods aren't own-enumerable).
function reflectMembers(obj: any): { methods: string[]; subNamespaces: string[] } {
  const methods = new Set<string>()
  const subs = new Set<string>()
  let o = obj
  while (o && o !== Object.prototype) {
    for (const key of Object.getOwnPropertyNames(o)) {
      if (key === 'constructor' || key.startsWith('_')) continue
      let val: unknown
      try {
        val = obj[key]
      } catch {
        continue
      }
      if (typeof val === 'function') methods.add(key)
      else if (val && typeof val === 'object') subs.add(key)
    }
    o = Object.getPrototypeOf(o)
  }
  return { methods: [...methods].sort(), subNamespaces: [...subs].sort() }
}

// ─── Individual tool handlers ─────────────────────────────────────────────────

const tree: ToolHandler = async (_input, ctx) => {
  const drawing = getDrawing(ctx.drawingId)
  if (!drawing?.structure?.tree) {
    return { result: { tree: null, hint: 'No structure tree available. Create a part or assembly first.' } }
  }
  const treeData = drawing.structure.tree
  const nodes = Object.values(treeData).map((n: any) => ({
    id: n.id,
    class: n.class,
    name: n.name,
    parent: n.parent,
  }))
  return {
    result: {
      currentProduct: drawing.structure.currentProduct,
      currentInstance: drawing.structure.currentInstance,
      nodeCount: nodes.length,
      nodes,
    },
  }
}

const find: ToolHandler = async (input, ctx) => {
  const { type, name } = input as { type?: string; name?: string }
  const drawing = getDrawing(ctx.drawingId)
  if (!drawing?.structure?.tree) {
    return { result: { count: 0, nodes: [] } }
  }
  const needle = name?.toLowerCase()
  const hits = Object.values(drawing.structure.tree).filter((n: any) => {
    if (type && n.class !== type) return false
    if (needle && !String(n.name ?? '').toLowerCase().includes(needle)) return false
    return true
  })
  return {
    result: {
      count: hits.length,
      nodes: hits.map((n: any) => ({ id: n.id, class: n.class, name: n.name, parent: n.parent })),
    },
  }
}

const inspect: ToolHandler = async (input, ctx) => {
  const { id } = input as { id: string | number }
  const drawing = getDrawing(ctx.drawingId)
  if (!drawing?.structure?.tree) {
    return { error: 'No structure tree available.' }
  }
  const node = drawing.structure.tree[String(id)] as any
  if (!node) {
    return { error: `Node with id "${id}" not found.` }
  }
  // Build parent chain
  const parentChain: Array<{ id: any; class: string; name: string }> = []
  let cur = node
  while (cur?.parent != null) {
    const p = drawing.structure.tree[String(cur.parent)] as any
    if (!p) break
    parentChain.push({ id: p.id, class: p.class, name: p.name })
    cur = p
  }
  return { result: { ...node, parentChain } }
}

const getSelection: ToolHandler = async (_input, ctx) => {
  const drawing = getDrawing(ctx.drawingId)
  const selected = drawing?.interaction?.selected ?? []
  return { result: selected }
}

const setSelection: ToolHandler = async (input, ctx) => {
  const { items } = input as { items: any[] }
  const drawing = getDrawing(ctx.drawingId)
  drawing?.api?.interaction?.setSelected(items ?? [])
  return { result: { ok: true, count: items?.length ?? 0 } }
}

const listMethods: ToolHandler = async (input, ctx) => {
  const { namespace, domain, filter } = input as { namespace?: string; domain?: string; filter?: string }

  // No namespace and no v1 filters → list the available namespaces.
  if (!namespace && !domain && !filter) {
    return {
      result: {
        namespaces: listNamespaces(ctx.drawingId),
        note:
          'v1 = ClassCAD (documented, object args). facade = session/history (undo/redo/fetchTree/…; current drawing ' +
          'auto-targeted). others = buerli drawing ops (positional args). Call list_methods({ namespace }) for its methods.',
      },
    }
  }

  const ns = namespace || 'v1'

  // ── v1: documented registry, via the shared @classcad/skill/discovery module
  // (ranked search over name + summary, CAD synonyms expanded — same logic as
  // the ClassCAD MCP) ──
  if (ns === 'v1') {
    if (!getMethodRegistry()) return { error: 'Method registry not loaded. No method metadata available.' }
    const res = getDiscovery().searchMethods({ domain, search: filter })
    return { result: { namespace: 'v1', count: res.count, ...(res.note ? { note: res.note } : {}), methods: res.methods } }
  }

  if (ns === 'v0') return { error: 'v0 is legacy and not exposed — use v1.' }

  // ── facade + buerli drawing APIs: reflect the live object ──
  if (!isCallableNamespace(ctx.drawingId, ns)) {
    return { error: `Unknown namespace "${ns}". Call list_methods (no args) to see available namespaces.` }
  }
  const root = resolveNamespace(ctx.drawingId, ns)
  let { methods, subNamespaces } = reflectMembers(root)
  if (filter) {
    const needle = filter.toLowerCase()
    methods = methods.filter(m => m.toLowerCase().includes(needle))
  }
  return {
    result: {
      namespace: ns,
      note:
        `Reflected from the live API. Call as "${ns}.<method>" with POSITIONAL args (an array)` +
        (ns === 'facade' ? ' — the current drawing is auto-targeted, so pass only extra args.' : '.') +
        ' Most have no docs — try describe_method, or call and learn from the result/error.',
      methods: methods.map(m => ({ name: `${ns}.${m}`, summary: API_EXTRAS[`${ns}.${m}`]?.summary ?? '' })),
      subNamespaces: subNamespaces.map(s => `${ns}.${s}`),
    },
  }
}

// One documentation key: v1 method (full or bare name), topic doc ("DATA"),
// recipe ("recipes/…"), overview ("api/part"), or a non-v1 namespace path.
async function describeOne(method: string, ctx: ToolExecutorContext): Promise<ToolResult> {
  if (!method) {
    return { error: 'Provide a method path, e.g. "v1.part.box" or "structure.calculateProductBounds".' }
  }
  const ns = method.split('.')[0]
  const hasPath = method.includes('.')

  // Bare name (no dot). If it names a buerli namespace, the model passed a
  // namespace where a method was expected — guide it instead of failing.
  if (!hasPath) {
    if (ns !== 'v1' && isCallableNamespace(ctx.drawingId, ns)) {
      return {
        result:
          `"${ns}" is a namespace, not a method. Call list_methods({ namespace: "${ns}" }) to see its methods, ` +
          `then describe_method("${ns}.<method>"). These methods take POSITIONAL args (an array).`,
      }
    }
    // Otherwise treat it as a v1 method name and look it up in the registry/skill.
    return describeMethod(method)
  }

  // v1 dotted path → registry + skill docs.
  if (ns === 'v1') return describeMethod(method)

  // Curated extras doc, if any.
  const extra = API_EXTRAS[method]
  if (extra) {
    const parts = [`# ${method}\n`, `**Summary**: ${extra.summary}\n`]
    if (extra.params?.length) {
      parts.push('**Parameters** (positional, pass as an args array):')
      for (const p of extra.params) parts.push(`- \`${p.name}\`: ${p.text}`)
    }
    return { result: parts.join('\n') }
  }

  // Fall back to runtime reflection (arity only).
  if (isCallableNamespace(ctx.drawingId, ns)) {
    const root = resolveNamespace(ctx.drawingId, ns)
    const { fn } = resolveCallable(root, method.split('.').slice(1))
    if (typeof fn === 'function') {
      return {
        result:
          `# ${method}\n\nNo curated docs. Reflected: a function taking ~${fn.length} positional argument(s). ` +
          `Call ${method} with an args array and learn its shape from the result or error.`,
      }
    }
  }
  return { error: `"${method}" is not a known method. Use list_methods({ namespace: "${ns}" }) to discover it.` }
}

const loadFile: ToolHandler = async (input, ctx) => {
  const { name } = input as { name: string }
  const att = ctx.attachments?.find(a => a.name === name)
  if (!att) {
    const available = ctx.attachments?.map(a => a.name).join(', ') || '(none attached)'
    return { error: `No attached file named "${name}". Available: ${available}` }
  }
  try {
    const api = createApi(ctx.drawingId) as any
    const load = api?.v0?.baseModeler?.load
    if (typeof load !== 'function') {
      return { error: 'File import is unavailable (v0.baseModeler.load not found on the API).' }
    }
    const ext = (name.split('.').pop() || '').toLowerCase()
    // baseModeler.load requires an empty drawing ("there is already a model…"),
    // so replace the current scene: clear all objects (the editor's default part)
    // first, then import the file into the same drawing.
    if (typeof api?.v1?.common?.clear === 'function') {
      await api.v1.common.clear({})
    }
    const result = await load(base64ToArrayBuffer(att.data), ext, name)
    return { result: { loaded: name, type: ext, replacedScene: true, result } }
  } catch (e) {
    return { error: `Failed to load "${name}": ${toErrorMessage(e)}` }
  }
}

// Export a model to a downloadable file. Returns the bytes (base64) in
// result.download — kept app-side and rendered as a download button; never sent
// to the model (buildToolResultContent strips it to metadata-only).
// ClassCAD save format codes (STEP is "STP"; valid set is OFB/STP/STL/SCG/IWP — DXF
// is broken in the engine). We request encoding:base64 and NO compression so the
// returned content base64-decodes straight to the real file bytes (a deflate would
// need re-inflating before it's a valid .step/.stl/.ofb).
const DOWNLOAD_FORMATS: Record<string, { fmt: string; ext: string; mime: string }> = {
  STEP: { fmt: 'STP', ext: 'step', mime: 'application/step' },
  STP: { fmt: 'STP', ext: 'step', mime: 'application/step' },
  STL: { fmt: 'STL', ext: 'stl', mime: 'model/stl' },
  OFB: { fmt: 'OFB', ext: 'ofb', mime: 'application/octet-stream' },
}

function ensureExt(name: string, ext: string): string {
  let clean = (name || 'model').trim().replace(/[/\\:*?"<>|]/g, '_') || 'model'
  clean = clean.replace(/\.(step|stp|stl|ofb|iges|igs|scg|dxf)$/i, '') // drop a stray CAD ext
  return `${clean}.${ext}`
}

const download: ToolHandler = async (input, ctx) => {
  const { format, filename } = input as { format?: string; filename?: string }
  const info = DOWNLOAD_FORMATS[(format || 'STEP').toUpperCase()] ?? DOWNLOAD_FORMATS.STEP
  try {
    const save = (createApi(ctx.drawingId) as any)?.v1?.common?.save
    if (typeof save !== 'function') {
      return { error: 'Export unavailable (v1.common.save not found on the API).' }
    }
    // No file/url param → the engine returns the model as a data string.
    const raw = await save({ format: info.fmt, encoding: 'base64' })
    const base64 = extractBase64(raw)
    if (!base64) return { error: `Export produced no data for format ${info.fmt}.` }
    const name = ensureExt(filename || 'model', info.ext)
    const size = Math.floor((base64.length * 3) / 4)
    return { result: { download: { filename: name, mimeType: info.mime, data: base64 }, filename: name, format: info.fmt, size } }
  } catch (e) {
    return { error: `Export failed: ${toErrorMessage(e)}` }
  }
}

// snapshot — DETERMINISTIC render of the drawing via @classcad/renderer:
// standard views, whole model in frame, full verification toolkit
// (section/sheet/highlightAt/markers/annotate/xray/colors/frame/layers).
const snapshot: ToolHandler = async (input, ctx) => {
  const { label, width, height, quality, ...renderOptions } = input as Record<string, any>
  try {
    const session = browserSession(ctx.drawingId)
    let [tree, graphic] = await Promise.all([session.getTree(), session.getGraphic()])
    // Adaptive fine tessellation for the render — same central helper as the
    // node hosts (@classcad/renderer core). Needs a recalc to re-tessellate,
    // so it is skipped when the drawing ever used v1.solid.* (recalc destroys
    // injected bodies) or when the caller asks for quality:'fast'. Previous
    // worker params are restored — they persist globally across sessions.
    if (quality !== 'fast' && !drawingUsedSolidApi(ctx.drawingId)) {
      const restore = await applyAdaptiveFaceting(session, graphic)
      if (restore) {
        try {
          await session.execute({ 'v1.common.recalc': [{}] })
          ;[tree, graphic] = await Promise.all([session.getTree(), session.getGraphic()])
        } finally {
          try { await session.execute({ 'v1.common.setFacetingParameters': [restore] }) } catch { /* leave as-is */ }
        }
      }
    }
    const entries = await renderSessionData(
      { tree: tree as any, graphic: graphic as any, execute: session.execute as any },
      {
        width: width ?? 1024,
        height: height ?? 768,
        ...renderOptions,
        layers: renderOptions.layers ?? ['solid'],
      },
    )
    if (!entries.length) {
      return { error: 'Nothing to render — the drawing has no visible content (or no graphic data is available yet).' }
    }
    const first = entries.find(e => e.kind === 'pixels') ?? entries[0]
    const image = await entryToPngBase64(first)
    const raster = first as { width?: number; height?: number; frame?: unknown; type?: string }
    return {
      result: {
        image,
        mimeType: 'image/png',
        width: raster.width ?? width ?? 1024,
        height: raster.height ?? height ?? 768,
        label: label ?? raster.type ?? 'render',
        // Reusable via options.frame for pixel-comparable before/after renders.
        frame: raster.frame,
        rendered: entries.map(e => e.type),
      },
    }
  } catch (e) {
    return { error: `Snapshot render failed: ${toErrorMessage(e)}` }
  }
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────


// Bulk documentation: resolve MANY keys in one round — methods, topic docs,
// recipes, overviews. One agent round instead of one per document.
const docsTool: ToolHandler = async (input, ctx) => {
  const { keys } = input as { keys?: unknown }
  const list = Array.isArray(keys) ? keys.filter((k): k is string => typeof k === 'string' && k.trim() !== '') : []
  if (list.length === 0) {
    return { error: 'Provide keys: an array of documentation keys, e.g. ["v1.part.extrusion", "SKETCHING", "recipes/parametric-part"].' }
  }
  const sections: string[] = []
  const failures: string[] = []
  for (const key of list.slice(0, 24)) {
    const r = await describeOne(key.trim(), ctx)
    if (typeof r.result === 'string') {
      const text = r.result.length > 40000 ? r.result.slice(0, 40000) + `\n\n[${key}: truncated at 40k chars]` : r.result
      sections.push(`# ═══ ${key} ═══\n\n${text}`)
    }
    else if (r.result) sections.push(`# ═══ ${key} ═══\n\n${JSON.stringify(r.result)}`)
    else failures.push(`${key}: ${r.error ?? 'not found'}`)
  }
  if (failures.length) sections.push(`# ═══ not found ═══\n${failures.join('\n')}`)
  return { result: sections.join('\n\n') }
}

const HANDLERS: Record<string, ToolHandler> = {
  run_script: runScriptHandler,
  tree,
  find,
  inspect,
  get_selection: getSelection,
  set_selection: setSelection,
  list_methods: listMethods,
  docs: docsTool,
  snapshot,
  load_file: loadFile,
  download,
  checkpoint,
  restore,
  notes,
}

export async function executeTool(
  toolName: string,
  input: Record<string, unknown>,
  ctx: ToolExecutorContext,
): Promise<ToolResult> {
  const handler = HANDLERS[toolName]
  if (!handler) {
    return { error: `Unknown tool: "${toolName}"` }
  }
  try {
    return await handler(input, ctx)
  } catch (e) {
    return { error: `Tool execution error: ${toErrorMessage(e)}` }
  }
}
