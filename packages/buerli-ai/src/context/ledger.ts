// ─── Session ledger — what stands in for condensed work ───────────────────────
//
// Generated deterministically, without a model call, from two sources:
//   journal  the digests of the condensed steps (history: what was done, what
//            failed, what was rolled back) — placed where those steps were;
//   state    the live drawing, the live notes and the latest measurements
//            ("now") — placed at the end of the context at compaction time.
// Nothing here is the model's own summary of itself, so nothing here can drift.

import type { DrawingStructure, Message } from '../types'
import { digestTree } from './digestTree'

const JOURNAL_MAX_CHARS = 6000

type Entry = { step: number; tool: string; kind: string; line: string; keep: number }

/**
 * The build journal of all collapsed steps, oldest first. When it grows past its
 * cap, readings go first, then references — builds, failures and records stay.
 */
export function buildJournal(messages: Message[]): string {
  const entries: Entry[] = []
  const docKeys = new Set<string>()
  for (const m of messages) {
    const c = m.meta?.ctx
    if (!m.meta?.collapsed || !c) continue
    if (c.tool === 'docs') {
      for (const k of m.meta.docKeys ?? []) docKeys.add(k)
      continue // docs are listed once, below
    }
    const keep = c.failed || c.kind === 'build' || c.kind === 'record' ? 2 : c.kind === 'reference' ? 1 : 0
    entries.push({
      step: c.step,
      tool: c.tool,
      kind: c.kind,
      keep,
      line: `${String(c.step).padStart(3)}  ${c.tool}  ${c.digest}${c.dead ? '  (rolled back — these ids no longer exist)' : ''}`,
    })
  }
  if (!entries.length && !docKeys.size) return ''
  entries.sort((a, b) => a.step - b.step)

  let kept = entries
  let omitted = 0
  const size = (es: Entry[]) => es.reduce((n, e) => n + e.line.length + 1, 0)
  for (const level of [0, 1]) {
    if (size(kept) <= JOURNAL_MAX_CHARS) break
    // Drop the OLDEST entries of this importance until it fits.
    const victims = kept.filter((e) => e.keep === level)
    for (const v of victims) {
      if (size(kept) <= JOURNAL_MAX_CHARS) break
      kept = kept.filter((e) => e !== v)
      omitted++
    }
  }

  const first = entries[0]?.step
  const last = entries[entries.length - 1]?.step
  const lines = [
    `[Session ledger — host-generated. Steps ${first ?? '?'}–${last ?? '?'} of this session were condensed to save context; this is what they did.]`,
    ...kept.map((e) => e.line),
  ]
  if (omitted) lines.push(`(${omitted} older readings/lookups omitted)`)
  if (docKeys.size)
    lines.push(
      `docs read in those steps, no longer in context: ${[...docKeys].join(', ')}. REFETCH with docs([...]) before building on any of them — do not reconstruct API usage or recipe steps from memory.`,
    )
  return lines.join('\n')
}

/** The latest measurements the model took (read-only scripts), flagged when the geometry changed afterwards. */
function lastMeasurements(messages: Message[], epoch: number, max: number): string[] {
  const reads = messages
    .map((m) => m.meta?.ctx)
    .filter((c): c is NonNullable<typeof c> => !!c && c.tool === 'run_script' && c.kind === 'state-read' && !c.failed && !c.dead)
  return reads.slice(-max).map((c) => `${c.digest}${c.epoch < epoch ? '  (measured BEFORE later changes — re-measure before relying on it)' : ''}`)
}

export type StateSources = {
  /** undefined = this host cannot read the drawing (the section is left out). */
  structure: DrawingStructure | null | undefined
  notes: string
  /** Current drawing revision. */
  epoch: number
  /** Step at which this block is generated. */
  step: number
  /** A script timed out and is still running in the engine. */
  busy?: boolean
}

/** The state block: ground truth about "now", to be trusted over the model's memory of the conversation. */
export function buildStateBlock(messages: Message[], src: StateSources): string {
  const lines = [
    `[Session state as of step ${src.step} — host-generated from the live drawing. Where it disagrees with your memory of earlier steps, this is right. Ids below are stable; re-read with find/tree or api.tree() for detail.]`,
  ]
  if (src.busy) lines.push('! A script is still running in the engine — the drawing below may be mid-change.')
  if (src.structure !== undefined) lines.push('DRAWING', digestTree(src.structure))
  const measurements = lastMeasurements(messages, src.epoch, 3)
  if (measurements.length) lines.push('LATEST MEASUREMENTS', ...measurements.map((l) => `  ${l}`))
  lines.push('NOTES (your notes tool, verbatim)', src.notes.trim() ? src.notes.trim() : '  (empty — keep your plan, decisions and next step there)')
  return lines.join('\n')
}
