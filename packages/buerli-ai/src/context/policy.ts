// ─── Policy — what to condense, in which order ────────────────────────────────
//
// Compaction only ever sets flags on message meta (see render.ts) and maintains
// the two ledger messages. It runs as ONE discrete event down to a target, never
// a little every round, so the sent prefix stays stable between events.
//
// Order — cheapest loss first, stopping as soon as the target is met:
//   A  zero-loss   rolled-back timelines · readings superseded by a newer one ·
//                  readings taken before the drawing changed
//   B  bulk        a build step keeps its digest, loses logs and script source ·
//                  old reports and lookups · docs (stub names the keys to refetch)
//   C  collapse    whole finished groups leave the context; the ledger stands in
//
// Never condensed: what the user said, reference images, the answer that closed
// each earlier turn, questions put to the user, the latest reports, the last few groups.

import type { Message } from '../types'
import { buildJournal } from './ledger'
import { estimateTokens, messageUnits, tokensOf, type Calibration } from './estimate'
import { renderContext } from './render'

export type CompactionCounts = { dead: number; superseded: number; stale: number; bulk: number; docs: number; collapsedGroups: number }

export type CompactionReport = {
  reason: string
  tier: 'A' | 'B' | 'C'
  beforeTokens: number
  afterTokens: number
  freedTokens: number
  counts: CompactionCounts
  /** Documentation that left the context and must be re-fetched before use. */
  docKeys: string[]
  /** Ledger texts as the model now sees them (only when groups were collapsed). */
  journal?: string
  state?: string
}

export type CompactOptions = {
  reason: string
  targetTokens: number
  cal: Calibration
  /** Current drawing revision: state-reads from an older one are stale. */
  epoch: number
  /** Groups at the end that are never touched. */
  keepGroups?: number
  /** Builds the state block (live drawing, notes, measurements). Called only when groups collapse. */
  buildState: () => string
}

type Group = { start: number; end: number } // [start, end)

const isRealUser = (m: Message) => m.role === 'user' && !m.meta?.synthetic
const hasToolUse = (m: Message) => m.role === 'assistant' && m.content.some((b) => b.type === 'tool_use')

/** A group is an assistant message with its tool results and the loop's own follow-ups. Never split. */
export function groupsOf(messages: Message[]): Group[] {
  const groups: Group[] = []
  let open: Group | null = null
  messages.forEach((m, i) => {
    if (m.meta?.ledger) return // ledger messages belong to no group
    if (m.role === 'assistant') {
      open = { start: i, end: i + 1 }
      groups.push(open)
    } else if (open && (m.role === 'tool' || m.meta?.synthetic)) {
      open.end = i + 1
    } else {
      open = null // a real user message closes the group
    }
  })
  return groups
}

function protectedGroups(messages: Message[], groups: Group[], keepGroups: number): Set<Group> {
  const keep = new Set<Group>()
  const live = groups.filter((g) => !messages[g.start].meta?.collapsed)
  for (const g of live.slice(-keepGroups)) keep.add(g)
  const reports: Group[] = []
  for (const g of groups) {
    const slice = messages.slice(g.start, g.end)
    if (slice.some((m) => m.meta?.referenceImage)) keep.add(g)
    if (slice.some((m) => m.meta?.ctx?.tool === 'ask_user')) keep.add(g)
    if (slice.some((m) => m.meta?.ctx?.tool === 'delegate')) reports.push(g)
    // The answer that closed a turn: no tool call, followed by the user (or nothing).
    const next = messages[g.end]
    if (!hasToolUse(messages[g.start]) && (!next || isRealUser(next))) keep.add(g)
  }
  for (const g of reports.slice(-2)) keep.add(g)
  return keep
}

const stubJson = (text: string) => JSON.stringify({ condensed: text })

function stubFor(m: Message, why: 'dead' | 'superseded' | 'stale' | 'bulk' | 'reference'): string {
  const c = m.meta!.ctx!
  const what = `${c.tool}: ${c.digest}`
  switch (why) {
    case 'dead':
      return stubJson(`ROLLED BACK — a later restore/load_file discarded this step; ids and values from it no longer exist. (${what})`)
    case 'superseded':
      return stubJson(`Superseded by a newer ${c.tool} result later in this conversation. (${what})`)
    case 'stale':
      return stubJson(`Reading taken before the drawing changed — out of date. Re-read (tree/find/inspect, or api.tree() in a script) if you need it. (${what})`)
    case 'reference':
      return m.meta?.docKeys?.length
        ? stubJson(
            `Documentation removed to save context: ${m.meta.docKeys.join(', ')}. REFETCH docs([...]) before building on any of it — do NOT reconstruct API usage or recipe steps from memory of a removed doc.`,
          )
        : stubJson(`Lookup removed to save context — call again if needed. (${what})`)
    default:
      return stubJson(`Condensed to its outcome. ${what}`)
  }
}

export function compact(messages: Message[], o: CompactOptions): CompactionReport | null {
  const keepGroups = o.keepGroups ?? 4
  const beforeTokens = estimateTokens(renderContext(messages), o.cal)
  const counts: CompactionCounts = { dead: 0, superseded: 0, stale: 0, bulk: 0, docs: 0, collapsedGroups: 0 }
  const droppedDocs = new Set<string>()
  let est = beforeTokens
  let tier: CompactionReport['tier'] = 'A'

  const groups = groupsOf(messages)
  const kept = protectedGroups(messages, groups, keepGroups)
  const inKept = new Set<number>()
  for (const g of kept) for (let i = g.start; i < g.end; i++) inKept.add(i)

  // Tool results that may be condensed at all.
  const candidates = messages
    .map((m, i) => ({ m, i }))
    .filter(({ m, i }) => m.role === 'tool' && m.meta?.ctx && !m.meta.collapsed && !m.meta.referenceImage && !inKept.has(i))

  const savedBy = (m: Message, stub: string): number => {
    const u = m.meta?.ctx?.stub != null ? { chars: m.meta.ctx.stub.length, images: 0 } : messageUnits(m)
    return tokensOf({ chars: Math.max(0, u.chars - stub.length), images: u.images }, o.cal)
  }
  const applyStub = (m: Message, why: Parameters<typeof stubFor>[1]): boolean => {
    const stub = stubFor(m, why)
    const saved = savedBy(m, stub)
    if (saved < 40) return false // not worth a changed prefix
    m.meta!.ctx!.stub = stub
    est -= saved
    if (why === 'reference') for (const k of m.meta?.docKeys ?? []) droppedDocs.add(k)
    return true
  }
  const sizeDesc = (a: { m: Message }, b: { m: Message }) => messageUnits(b.m).chars + messageUnits(b.m).images * 6000 - (messageUnits(a.m).chars + messageUnits(a.m).images * 6000)

  // ── Tier A: zero-loss ──
  const laterSig = new Map<string, number>() // signature → index of its LAST live occurrence
  const laterDocs = new Map<string, number>() // doc key → index of its LAST live occurrence
  messages.forEach((m, i) => {
    if (m.role !== 'tool' || m.meta?.collapsed || m.meta?.ctx?.stub != null) return
    if (m.meta?.ctx?.sig) laterSig.set(m.meta.ctx.sig, i)
    for (const k of m.meta?.docKeys ?? []) laterDocs.set(k, i)
  })
  const isSuperseded = ({ m, i }: { m: Message; i: number }) => {
    const c = m.meta!.ctx!
    if (c.sig) return (laterSig.get(c.sig) ?? -1) > i
    const keys = m.meta?.docKeys
    return !!keys?.length && keys.every((k) => (laterDocs.get(k) ?? -1) > i)
  }
  const fresh = candidates.filter(({ m }) => m.meta!.ctx!.stub == null)
  const passes: Array<[keyof CompactionCounts, Parameters<typeof stubFor>[1], (c: { m: Message; i: number }) => boolean]> = [
    ['dead', 'dead', ({ m }) => !!m.meta!.ctx!.dead],
    ['superseded', 'superseded', isSuperseded],
    ['stale', 'stale', ({ m }) => m.meta!.ctx!.kind === 'state-read' && m.meta!.ctx!.epoch < o.epoch],
  ]
  for (const [counter, why, test] of passes) {
    for (const c of fresh.filter((x) => x.m.meta!.ctx!.stub == null && test(x)).sort(sizeDesc)) {
      if (est <= o.targetTokens) break
      if (applyStub(c.m, why)) counts[counter]++
    }
  }

  // ── Tier B: bulk ──
  if (est > o.targetTokens) {
    tier = 'B'
    const elide = (m: Message, inputChars: number) => {
      if (m.meta!.ctx!.elideInput) return
      m.meta!.ctx!.elideInput = true
      est -= tokensOf({ chars: Math.max(0, inputChars - 160), images: 0 }, o.cal)
    }
    const inputChars = new Map<string, number>()
    for (const m of messages)
      if (m.role === 'assistant')
        for (const b of m.content)
          if (b.type === 'tool_use') inputChars.set(b.id, typeof b.input.script === 'string' ? b.input.script.length : typeof b.input.text === 'string' ? b.input.text.length : 0)

    const bulk = candidates.filter(({ m }) => m.meta!.ctx!.kind === 'build' || m.meta!.ctx!.kind === 'record' || m.meta!.ctx!.tool === 'run_script')
    for (const c of bulk.sort(sizeDesc)) {
      if (est <= o.targetTokens) break
      const ctx = c.m.meta!.ctx!
      let changed = false
      if (ctx.stub == null) changed = applyStub(c.m, 'bulk')
      const chars = c.m.role === 'tool' ? (inputChars.get(c.m.tool_use_id) ?? 0) : 0
      if ((ctx.tool === 'run_script' || ctx.tool === 'notes') && chars > 400) {
        elide(c.m, chars)
        changed = true
      }
      if (changed) counts.bulk++
    }
    // Lookups, then documentation — oldest first: the recipe fetched last is the one in use.
    const refs = candidates.filter(({ m }) => m.meta!.ctx!.kind === 'reference' && m.meta!.ctx!.stub == null)
    for (const c of [...refs.filter((r) => r.m.meta!.ctx!.tool !== 'docs'), ...refs.filter((r) => r.m.meta!.ctx!.tool === 'docs')]) {
      if (est <= o.targetTokens) break
      if (applyStub(c.m, 'reference')) counts[c.m.meta!.ctx!.tool === 'docs' ? 'docs' : 'bulk']++
    }
  }

  // ── Tier C: collapse finished groups, oldest first ──
  let journal: string | undefined
  let state: string | undefined
  if (est > o.targetTokens) {
    tier = 'C'
    const rendered = (g: Group) => renderContext(messages.slice(g.start, g.end))
    for (const g of groups) {
      if (est <= o.targetTokens) break
      if (kept.has(g) || messages[g.start].meta?.collapsed) continue
      const units = rendered(g).reduce((n, m) => n + tokensOf(messageUnits(m), o.cal), 0)
      for (let i = g.start; i < g.end; i++) {
        const m = messages[i]
        m.meta = { ...m.meta, collapsed: true }
        for (const k of m.meta.docKeys ?? []) if (m.meta.ctx?.stub == null) droppedDocs.add(k)
      }
      est -= units
      counts.collapsedGroups++
    }
    if (counts.collapsedGroups > 0) {
      // One ledger, regenerated: drop the previous one, rebuild from ALL collapsed steps.
      for (let i = messages.length - 1; i >= 0; i--) if (messages[i].meta?.ledger) messages.splice(i, 1)
      journal = buildJournal(messages)
      state = o.buildState()
      let lastCollapsed = -1
      messages.forEach((m, i) => {
        if (m.meta?.collapsed) lastCollapsed = i
      })
      if (journal) messages.splice(lastCollapsed + 1, 0, { role: 'user', content: journal, meta: { synthetic: true, ledger: 'journal' } })
      if (state) messages.push({ role: 'user', content: state, meta: { synthetic: true, ledger: 'state' } })
    }
  }

  const changed = counts.dead + counts.superseded + counts.stale + counts.bulk + counts.docs + counts.collapsedGroups
  if (!changed) return null
  const afterTokens = estimateTokens(renderContext(messages), o.cal)
  // A key that is still readable in a newer docs result was not lost.
  for (const m of messages) if (m.role === 'tool' && !m.meta?.collapsed && m.meta?.ctx?.stub == null) for (const k of m.meta?.docKeys ?? []) droppedDocs.delete(k)
  return {
    reason: o.reason,
    tier,
    beforeTokens,
    afterTokens,
    freedTokens: Math.max(0, beforeTokens - afterTokens),
    counts,
    docKeys: [...droppedDocs],
    journal,
    state,
  }
}

/** When to compact, in prompt tokens. Boundaries (a new user turn, a finished verification) use the lower mark. */
export function thresholds(limit: number, maxTokens: number): { trigger: number; boundaryTrigger: number; target: number; emergencyTarget: number; notice: number } {
  const trigger = Math.max(2000, Math.min(limit * 0.85, limit - maxTokens))
  return { trigger, boundaryTrigger: trigger * 0.75, target: limit * 0.5, emergencyTarget: limit * 0.4, notice: trigger * 0.85 }
}
