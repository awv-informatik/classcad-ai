// ─── Annotate — what is this tool result worth to the CAD task? ───────────────
//
// A generic agent cannot tell a tree dump from a user's answer. This host can:
// every tool is known, and so is what happens to its result over time.
//
//   reference   docs, method lists, fetched pages   → re-fetchable by key
//   state-read  tree, find, inspect, snapshot,      → a reading of the drawing; stale
//               read-only scripts                     as soon as the geometry changes
//   build       mutating scripts, load_file,        → a small fact worth keeping forever
//               checkpoint, restore                   (what was built, what failed), bulk that is not
//   record      reports, user answers, reference    → not re-derivable: protected
//               images, notes
//
// The drawing revision ("epoch") advances with every step that may have changed
// geometry. restore/load_file additionally kill a timeline: ids created on it no
// longer exist, and keeping them in context is a correctness risk, not just cost.

import type { ContextMeta, Message, ToolDiag, ToolResult } from '../types'

export type Tracker = {
  /** Current drawing revision. */
  epoch: number
  /** Ordinal of the last annotated tool call. */
  step: number
  /** Checkpoint label → step at which it was taken. */
  checkpoints: Map<string, number>
}

export type ToolCall = { name: string; input: Record<string, unknown> }

/**
 * Rebuild the tracker from stored history. A new user turn starts a new epoch:
 * the user may have edited the drawing in the app between turns, so earlier
 * state-reads cannot be trusted either way.
 */
export function createTracker(history: Message[]): Tracker {
  let epoch = 0
  let step = 0
  const checkpoints = new Map<string, number>()
  for (const m of history) {
    const c = m.meta?.ctx
    if (!c) continue
    if (c.epoch > epoch) epoch = c.epoch
    if (c.step > step) step = c.step
    if (c.tool === 'checkpoint' && c.label && !c.failed) checkpoints.set(c.label, c.step)
  }
  return { epoch: history.length ? epoch + 1 : 0, step, checkpoints }
}

// v1 methods that only read. Everything else may change the drawing.
const READ_ONLY_METHOD = /^(get|calculate|is[A-Z]|evaluate|export|save|requestVisualisation)/
// Script access to a non-core namespace (facade.undo, structure.*, selection.*) emits
// no operation events, so its effect is unknown — treat the script as mutating.
const NON_CORE_NAMESPACE = /\bapi\.(?!v1\b|tree\b|graphic\b|env\b|inspect\b)\w+/

/** True only when the script provably changed nothing: it ran engine calls, and all of them only read. */
export function isReadOnlyScript(source: string, diag: ToolDiag | undefined): boolean {
  if (!diag || diag.pending) return false
  if (NON_CORE_NAMESPACE.test(source)) return false
  const ops = diag.ops ?? []
  // No engine calls at all: a pure api.tree()/api.graphic() read.
  if (ops.length === 0) return /\bapi\.(tree|graphic|inspect)\b/.test(source)
  return ops.every((op) => READ_ONLY_METHOD.test(op.method.split('.').pop() ?? ''))
}

/** Does this call advance the drawing revision? Errs toward yes. */
export function callMutates(call: ToolCall, result: ToolResult): boolean {
  switch (call.name) {
    case 'run_script':
      return !isReadOnlyScript(String(call.input.script ?? ''), result.diag)
    case 'load_file':
    case 'restore':
      return true // both clear the drawing before loading, so a failure mutates too
    case 'delegate':
      return call.input.agent !== 'perception' // a building sub-agent works on the same drawing
    default:
      return false
  }
}

function kindOf(call: ToolCall, result: ToolResult): ContextMeta['kind'] {
  switch (call.name) {
    case 'docs':
    case 'list_methods':
      return 'reference'
    case 'fetch_url':
      return (result.result as { kind?: string } | undefined)?.kind === 'image' ? 'record' : 'reference'
    case 'tree':
    case 'find':
    case 'inspect':
    case 'get_selection':
    case 'snapshot':
      return 'state-read'
    case 'run_script':
      return callMutates(call, result) ? 'build' : 'state-read'
    case 'delegate':
    case 'ask_user':
    case 'notes':
      return 'record'
    default:
      return 'build' // load_file, download, checkpoint, restore, set_selection
  }
}

function signatureOf(call: ToolCall): string | undefined {
  const i = call.input
  switch (call.name) {
    case 'tree':
      return 'tree'
    case 'find':
      return `find:${JSON.stringify([i.type ?? null, i.name ?? null])}`
    case 'inspect':
      return `inspect:${String(i.id)}`
    case 'get_selection':
      return 'selection'
    case 'notes':
      return 'notes'
    default:
      return undefined
  }
}

const clip = (s: unknown, n: number): string => {
  const t = typeof s === 'string' ? s : (JSON.stringify(s) ?? '')
  return t.length > n ? `${t.slice(0, n)}…` : t
}

const firstLine = (s: string): string => s.split('\n').find((l) => l.trim()) ?? ''

/** "part.box×1, part.boolean×1" — in order of first use. */
export function summarizeOps(ops: ToolDiag['ops']): string {
  if (!ops?.length) return ''
  const counts = new Map<string, { n: number; failed: boolean }>()
  for (const op of ops) {
    const name = op.method.replace(/^v1\./, '')
    const e = counts.get(name) ?? { n: 0, failed: false }
    e.n++
    if (op.failed) e.failed = true
    counts.set(name, e)
  }
  const parts = [...counts.entries()].map(([name, e]) => `${name}×${e.n}${e.failed ? ' (failed)' : ''}`)
  return parts.length > 10 ? `${parts.slice(0, 10).join(', ')}, +${parts.length - 10} more` : parts.join(', ')
}

/**
 * Keys a `docs` result actually served: requested keys minus those the response
 * deferred ("NOT included yet … [..]") or did not find. A key the model never
 * received must not be reported as read.
 */
export function servedDocKeys(requested: unknown, resultText: unknown): string[] {
  const keys = Array.isArray(requested) ? (requested.filter((k) => typeof k === 'string') as string[]) : []
  const text = typeof resultText === 'string' ? resultText : ''
  const missing = new Set<string>()
  const deferred = text.match(/request these next in another docs call: (\[[^\n]*\])/)
  if (deferred) {
    try {
      for (const k of JSON.parse(deferred[1]) as unknown[]) if (typeof k === 'string') missing.add(k)
    } catch {
      /* unparsable header: fall through with nothing deferred */
    }
  }
  const notFound = text.split('# ═══ not found ═══')[1]
  if (notFound) for (const line of notFound.split('\n')) if (line.includes(':')) missing.add(line.split(':')[0].trim())
  return keys.map((k) => k.trim()).filter((k) => k && !missing.has(k))
}

function digestOf(call: ToolCall, result: ToolResult, docKeys: string[] | undefined): string {
  const i = call.input
  const r = result.result as Record<string, unknown> | string | undefined
  const failed = result.error ? ` → FAILED: ${clip(firstLine(result.error), 300)}` : ''
  switch (call.name) {
    case 'run_script': {
      const label = typeof i.label === 'string' && i.label ? `"${clip(i.label, 80)}"` : '(unlabelled)'
      const ops = summarizeOps(result.diag?.ops)
      const pending = result.diag?.pending ? ' → TIMED OUT, still running: outcome unknown' : ''
      const returned = !result.error && r && typeof r === 'object' && 'returned' in r ? ` → ok ${clip((r as { returned?: unknown }).returned, 400)}` : ''
      return `${label}${ops ? `  ${ops}` : ''}${failed || pending || returned || ' → ok'}`
    }
    case 'tree':
      return `${(r as { nodeCount?: number } | undefined)?.nodeCount ?? '?'} nodes${failed}`
    case 'find':
      return `${clip({ type: i.type, name: i.name }, 80)} → ${(r as { count?: number } | undefined)?.count ?? '?'} found${failed}`
    case 'inspect':
      return `#${String(i.id)} ${clip((r as { class?: string } | undefined)?.class ?? '', 40)} "${clip((r as { name?: string } | undefined)?.name ?? '', 40)}"${failed}`
    case 'get_selection':
      return `${Array.isArray(r) ? r.length : '?'} selected${failed}`
    case 'set_selection':
      return `${Array.isArray(i.items) ? i.items.length : '?'} items${failed}`
    case 'snapshot':
      return `${clip(i.label ?? i.view ?? 'view', 60)}${failed}`
    case 'docs':
      return `${docKeys?.length ? docKeys.join(', ') : clip(i.keys, 200)}${failed}`
    case 'list_methods':
      return `${clip({ namespace: i.namespace, domain: i.domain, filter: i.filter }, 120)}${failed}`
    case 'fetch_url':
      return `${clip(i.url, 120)}${(r as { title?: string } | undefined)?.title ? ` "${clip((r as { title?: string }).title, 60)}"` : ''}${failed}`
    case 'load_file':
      return `${clip(i.name, 80)} (replaced the drawing)${failed}`
    case 'download':
      return `${clip((r as { filename?: string } | undefined)?.filename ?? i.filename ?? i.format, 80)}${failed}`
    case 'checkpoint':
      return `"${clip((r as { label?: string } | undefined)?.label ?? i.label ?? '', 60)}"${failed}`
    case 'restore':
      return `"${clip((r as { restored?: string } | undefined)?.restored ?? i.label ?? '', 60)}"${failed}`
    case 'notes':
      return `${String(i.action ?? 'get')}${typeof i.text === 'string' ? ` (${i.text.length} chars)` : ''}${failed}`
    case 'delegate':
      return `${String(i.agent)}: ${clip(i.goal, 160)} → ${clip(typeof r === 'string' ? r : '', 600)}`
    case 'ask_user':
      return `asked: ${clip(i.questions, 400)}`
    default:
      return `${clip(i, 120)}${failed}`
  }
}

/**
 * Annotate one finished tool call. Does NOT advance the epoch: every result of a
 * parallel batch belongs to the revision the batch started from (so a read that
 * ran next to a mutation is stale right away). Call `advance` once per batch.
 */
export function annotate(tracker: Tracker, call: ToolCall, result: ToolResult): { ctx: ContextMeta; docKeys?: string[] } {
  tracker.step++
  const docKeys = call.name === 'docs' && !result.error ? servedDocKeys(call.input.keys, result.result) : undefined
  const r = result.result as { label?: string; restored?: string } | undefined
  const label = call.name === 'checkpoint' ? (r?.label ?? (call.input.label as string | undefined)) : call.name === 'restore' ? (r?.restored ?? (call.input.label as string | undefined)) : undefined
  const ctx: ContextMeta = {
    tool: call.name,
    kind: kindOf(call, result),
    epoch: tracker.epoch,
    step: tracker.step,
    digest: digestOf(call, result, docKeys),
  }
  const sig = signatureOf(call)
  if (sig) ctx.sig = sig
  const ops = summarizeOps(result.diag?.ops)
  if (ops) ctx.ops = ops
  if (label) ctx.label = label
  if (result.error) ctx.failed = true
  if (call.name === 'checkpoint' && label && !result.error) tracker.checkpoints.set(label, tracker.step)
  return { ctx, docKeys }
}

/** After a batch: a mutation anywhere in it starts a new drawing revision. */
export function advance(tracker: Tracker, batch: Array<{ call: ToolCall; result: ToolResult }>): boolean {
  const mutated = batch.some((b) => callMutates(b.call, b.result))
  if (mutated) tracker.epoch++
  return mutated
}

/**
 * restore / load_file discard a timeline. Mark what lived on it as dead so it is
 * first to go at the next compaction (not immediately: a restore usually follows
 * a failure, and the failed attempt is exactly what the model needs to read next).
 * Returns how many results were marked.
 */
export function markDeadTimeline(messages: Message[], tracker: Tracker, call: ToolCall, ctx: ContextMeta): number {
  let fromStep: number
  if (call.name === 'load_file') fromStep = 0
  else if (call.name === 'restore' && ctx.label && tracker.checkpoints.has(ctx.label) && !ctx.failed) fromStep = tracker.checkpoints.get(ctx.label)!
  else return 0 // unknown label (evicted, or taken by a sub-agent): revision advances, nothing is provably dead
  let marked = 0
  for (const m of messages) {
    const c = m.meta?.ctx
    if (!c || c.dead || c.step <= fromStep || c.step >= ctx.step) continue
    // Only readings and build steps die with a timeline. Docs stay valid, records stay true,
    // and a checkpoint taken on the dead timeline can still be restored.
    if ((c.kind !== 'state-read' && c.kind !== 'build') || c.tool === 'checkpoint') continue
    c.dead = true
    marked++
  }
  return marked
}
