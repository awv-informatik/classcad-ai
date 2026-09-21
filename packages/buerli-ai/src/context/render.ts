// ─── Render — the context the model actually receives ─────────────────────────
//
// The stored history is never rewritten. Compaction only sets flags on message
// meta; this pure function turns history + flags into the wire view:
//   - collapsed messages are left out (the session ledger stands in for them),
//   - a condensed tool result shows its stub instead of its content,
//   - the bulky input of a condensed call (script source, notes text) is elided.
// Between compaction events the view of the existing prefix does not change, so
// provider-side prompt caching keeps working.

import type { ContentBlock, Message, ToolUseBlock } from '../types'

/** Opening of an elided script. tools/script.ts refuses to run a script that starts with it. */
export const ELIDED_SCRIPT_MARKER = '/* [host] source elided'

export function elidedScript(source: string, opsSummary: string): string {
  return `${ELIDED_SCRIPT_MARKER} to save context (${source.length} chars)${opsSummary ? `. ops: ${opsSummary}` : ''}. Not runnable — write the script again if you need it. */`
}

function elideInput(block: ToolUseBlock, opsSummary: string): ToolUseBlock {
  const input = { ...block.input }
  if (block.name === 'run_script' && typeof input.script === 'string') input.script = elidedScript(input.script, opsSummary)
  else if (block.name === 'notes' && typeof input.text === 'string')
    input.text = `[host] text elided to save context (${input.text.length} chars) — read the current notes with action "get".`
  else return block
  return { ...block, input } // a NEW block: the stored one (and any signed thinking block beside it) stays untouched
}

export function renderContext(messages: Message[]): Message[] {
  // tool_use id → the result's compaction state
  const resultMeta = new Map<string, { elide: boolean; ops: string }>()
  for (const m of messages) {
    if (m.role !== 'tool' || !m.meta?.ctx?.elideInput || m.meta.collapsed) continue
    resultMeta.set(m.tool_use_id, { elide: true, ops: m.meta.ctx.ops ?? '' })
  }

  const out: Message[] = []
  for (const m of messages) {
    if (m.meta?.collapsed) continue
    if (m.role === 'tool' && m.meta?.ctx?.stub != null) {
      out.push({ role: 'tool', tool_use_id: m.tool_use_id, content: m.meta.ctx.stub, meta: m.meta })
      continue
    }
    if (m.role === 'assistant' && resultMeta.size) {
      let changed = false
      const content: ContentBlock[] = m.content.map((b) => {
        if (b.type !== 'tool_use') return b
        const state = resultMeta.get(b.id)
        if (!state) return b
        const next = elideInput(b, state.ops)
        if (next !== b) changed = true
        return next
      })
      out.push(changed ? { role: 'assistant', content, meta: m.meta } : m)
      continue
    }
    out.push(m)
  }
  return out
}

/**
 * Wire invariants every provider relies on. Returns the violations (empty = valid):
 * a tool result needs its tool_use in the nearest preceding assistant message, every
 * tool_use needs a result before the next assistant message, and the list starts with a user message.
 */
export function checkWireInvariants(rendered: Message[]): string[] {
  const problems: string[] = []
  if (rendered.length && rendered[0].role !== 'user') problems.push('first message is not a user message')
  let open = new Set<string>()
  for (let i = 0; i < rendered.length; i++) {
    const m = rendered[i]
    if (m.role === 'assistant') {
      if (open.size) problems.push(`tool_use without result before message ${i}: ${[...open].join(', ')}`)
      open = new Set(m.content.filter((b): b is ToolUseBlock => b.type === 'tool_use').map((b) => b.id))
    } else if (m.role === 'tool') {
      if (!open.has(m.tool_use_id)) problems.push(`tool result ${m.tool_use_id} at ${i} has no matching tool_use`)
      open.delete(m.tool_use_id)
    } else if (open.size) {
      problems.push(`user message at ${i} sits between a tool_use and its result`)
    }
  }
  if (open.size) problems.push(`tool_use without result at the end: ${[...open].join(', ')}`)
  return problems
}
