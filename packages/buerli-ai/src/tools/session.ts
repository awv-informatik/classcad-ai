// Browser ScriptSession — adapts the buerli client (@buerli.io/classcad WASM +
// @buerli.io/core store) to the @classcad/script session contract.
//
// Guaranteed surface (identical to the MCP/harness sessions):
//   execute    — v1 commands; during scripts they go through the RAW client
//                with per-call `disableGraphics` (see below), falling back to
//                createApi when the raw client isn't reachable
//   getTree    — the live structure tree from the store
//   getGraphic — the live SCG graphic containers from the store (meshes/edges/
//                vertices — scripts filter geometry themselves)
// Browser-only capabilities (facade/structure/selection/…) are injected as
// optional namespaces — scripts guard them (`if (api.facade) …`) or stay
// portable by sticking to the guaranteed surface.
//
// ── Per-call graphic suppression ──────────────────────────────────────────────
// The engine merges per-command config over the connection defaults for EVERY
// command (CommandFactory::MergeConfiguration; without commandVersion the v0
// branch reads root-level fields such as `disableGraphics`). Serializing the
// graphic on every response is what makes the in-browser engine slow and
// memory-hungry (std::bad_alloc in the response path), so run_script executes
// its mutations with `disableGraphics: true` and the graphic is refreshed ONCE
// afterwards. Structure/tree patches stay enabled throughout — api.tree() and
// the model tree UI remain live.

import { createApi, BuerliCadFacade } from '@buerli.io/classcad'
// Internal module — the raw per-drawing client cache is not re-exported by the
// package index. No `exports` map in package.json, so the deep import is valid.
// @ts-ignore — no type declarations for the deep path
import { Globals } from '@buerli.io/classcad/build/esm/globals'
import { getDrawing } from '@buerli.io/core'
import type { ScriptSession, Task, Envelope } from '@classcad/script'
import type { DrawingID } from '@buerli.io/core'

/** The raw AwvNodeClient for a drawing, or null (older client builds). */
function rawClient(drawingId: DrawingID): { request: (cmd: Record<string, unknown>) => Promise<Envelope> } | null {
  const client = (Globals as any)?.clientCache?.[drawingId]
  return client && typeof client.request === 'function' ? client : null
}

// The engine omits brep EDGE data from graphic payloads until the graphic
// database settings are enabled (same as the node session's lazy ensure) —
// without them, snapshots render silhouettes with no edges. Once per drawing.
const dbSettingsEnsured = new Set<string>()
async function ensureGraphicSettings(drawingId: DrawingID): Promise<void> {
  if (dbSettingsEnsured.has(String(drawingId))) return
  dbSettingsEnsured.add(String(drawingId))
  try {
    const client = rawClient(drawingId)
    const task = [{ 'v1.common.setDatabaseSettings': [{ isGraphicEnabled: true, isCCGraphicEnabled: true, isSketchGraphicEnabled: true, doCurveTessellation: true }] }]
    if (client) await client.request({ command: 'Execute', task, options: { undoable: false } })
    else await (createApi(drawingId) as any)?.v1?.common?.setDatabaseSettings?.({ isGraphicEnabled: true, isCCGraphicEnabled: true, isSketchGraphicEnabled: true, doCurveTessellation: true })
  } catch {
    /* older engines — proceed without edges */
  }
}

/** True when the rejected value is a ClassCAD response envelope (API error), not a transport failure. */
function isEnvelope(e: unknown): e is Envelope {
  return !!e && typeof e === 'object' && ('maxLevel' in (e as object) || 'messages' in (e as object))
}

function normalizeError(prefix: string, e: unknown): Error {
  if (e instanceof Error) return e
  let detail: string
  try {
    detail = typeof e === 'string' ? e : JSON.stringify(e)
  } catch {
    detail = String(e)
  }
  return new Error(`${prefix}: ${detail}`)
}

/**
 * Refresh tree + graphic after a graphic-suppressed run. Goes through the
 * regular createApi path so the store gets its usual post-command cleanup.
 * `recalc: false` skips the graphic-regenerating recalc (EIF/solid.* sessions —
 * recalc destroys injected bodies; the tree still refreshes).
 */
export async function refreshAfterScript(drawingId: DrawingID, opts?: { recalc?: boolean }): Promise<void> {
  try {
    await (BuerliCadFacade as any)?.utils?.fetchTree?.(drawingId)
  } catch {
    /* tree patches kept the store close enough */
  }
  if (opts?.recalc === false) return
  try {
    await (createApi(drawingId) as any)?.v1?.common?.recalc?.({})
  } catch {
    /* stale viewport is better than a failed script result */
  }
}

export interface BrowserSessionOptions {
  /** Execute mutations with per-call `disableGraphics` (run_script does this; refresh once afterwards). */
  suppressGraphics?: boolean
}

export interface BrowserScriptSession extends ScriptSession {
  /** True once the session executed a v1.solid.* call (recalc would destroy those bodies). */
  usedSolidApi(): boolean
}

// Drawing-level record of v1.solid.* usage — outlives the per-call session
// instances (snapshot creates a fresh session and must know whether a recalc
// would destroy injected bodies from an EARLIER script's session).
const solidApiDrawings = new Set<string>()

/** True when ANY session on this drawing executed a v1.solid.* call. */
export function drawingUsedSolidApi(drawingId: DrawingID): boolean {
  return solidApiDrawings.has(String(drawingId))
}

/** Create a ScriptSession over the live buerli drawing. */
export function browserSession(drawingId: DrawingID, opts: BrowserSessionOptions = {}): BrowserScriptSession {
  let sawSolidCall = false
  let graphicStale = false

  async function execute(task: Task): Promise<Envelope> {
    await ensureGraphicSettings(drawingId)
    const [key, args] = Object.entries(task)[0] ?? []
    const segments = (key ?? '').split('.')
    if (segments.length !== 3 || segments[0] !== 'v1') {
      throw new Error(`Browser session executes v1 tasks only (got "${key}").`)
    }
    const [, domain, method] = segments
    if (domain === 'solid') {
      sawSolidCall = true
      solidApiDrawings.add(String(drawingId))
    }

    // Preferred path: raw client with per-call graphic suppression.
    const client = opts.suppressGraphics ? rawClient(drawingId) : null
    if (client) {
      const envelope = {
        command: 'Execute',
        task: [{ [`v1.${domain}.${method}`]: [args?.[0] ?? {}] }],
        options: { undoable: false },
        disableGraphics: true, // per-call: engine skips graphic serialization for this response
      }
      try {
        graphicStale = true
        return (await client.request(envelope)) as Envelope
      } catch (e: unknown) {
        // The client REJECTS on maxLevel >= error but the rejection IS the
        // response envelope — surface it like the node session does (scripts
        // read maxLevel/messages; execute only throws on transport failures).
        if (isEnvelope(e)) return e
        throw normalizeError(`v1.${domain}.${method} failed`, e)
      }
    }

    // Fallback: the regular createApi path (also used when suppression is off).
    const fn = (createApi(drawingId) as any)?.v1?.[domain]?.[method]
    if (typeof fn !== 'function') {
      throw new Error(`v1.${domain}.${method} is not available on this client.`)
    }
    try {
      return (await fn(args?.[0] ?? {})) as Envelope
    } catch (e: unknown) {
      if (isEnvelope(e)) return e
      throw normalizeError(`v1.${domain}.${method} failed`, e)
    }
  }

  return {
    env: 'browser',
    execute,
    getTree: async (o?: { refresh?: boolean }) => {
      if (o?.refresh) {
        try {
          await (BuerliCadFacade as any)?.utils?.fetchTree?.(drawingId)
        } catch {
          /* store copy is still served below */
        }
      }
      return ((getDrawing(drawingId) as any)?.structure?.tree ?? {}) as import('@classcad/script').Tree
    },
    getGraphic: async (o?: { recalc?: boolean }) => {
      await ensureGraphicSettings(drawingId)
      // Under suppression the store's graphic lags behind — refresh before the
      // script reads it (recalc regenerates; skipped for solid.*/recalc:false).
      if (graphicStale) {
        await refreshAfterScript(drawingId, { recalc: o?.recalc === false || sawSolidCall ? false : true })
        graphicStale = false
      }
      const drawing = getDrawing(drawingId) as any
      const containers = drawing?.graphic?.containers
      if (!containers) return null
      // Filter out containers owned by CONSUMED CC_Solids — the store can keep
      // superseded tool bodies around (especially since the suppressed raw path
      // skips buerli's per-call graphic cleanup), and rendering them stacks old
      // tools on top of the current part.
      const tree = drawing?.structure?.tree ?? {}
      const live = (Object.values(containers) as import('@classcad/script').GraphicContainer[]).filter(c => {
        const owner = c.owner != null ? (tree[String(c.owner)] as import('@classcad/script').TreeNode | undefined) : undefined
        if (!owner || owner.class !== 'CC_Solid') return true // curves, sketches, unknown — keep
        return (owner.members as Record<string, { value?: unknown }> | undefined)?.consumed?.value !== 1
      })
      return { containers: live }
    },
    usedSolidApi: () => sawSolidCall,
    namespaces: browserNamespaces(drawingId),
  }
}

/** Build the optional browser namespaces (facade with auto drawing id + live drawing APIs). */
function browserNamespaces(drawingId: DrawingID): Record<string, unknown> {
  const namespaces: Record<string, unknown> = {}

  const utils = (BuerliCadFacade as any)?.utils
  if (utils && typeof utils === 'object') {
    const facade: Record<string, unknown> = {}
    for (const key of Object.getOwnPropertyNames(utils)) {
      const val = utils[key]
      if (typeof val !== 'function') continue
      facade[key] = key === 'connect' ? val.bind(utils) : (...args: unknown[]) => val.call(utils, drawingId, ...args)
    }
    namespaces.facade = facade
  }

  const drawingApi = (getDrawing(drawingId) as any)?.api ?? {}
  for (const key of Object.keys(drawingApi)) {
    const val = drawingApi[key]
    if (val && typeof val === 'object' && !(key in namespaces)) namespaces[key] = val
  }
  return namespaces
}
