// ─── notes — a tiny persistent scratchpad for long tasks ──────────────────────
//
// Long builds need a plan artifact that survives context pruning: which step is
// done, which ids matter, what the next action is. The notes live app-side per
// drawing; the model reads/writes them explicitly. This is working memory, not
// chat history — keep it short and current.

import type { ToolExecutorContext, ToolHandler } from '../types'

const MAX_NOTES_CHARS = 8000

const notesByDrawing = new Map<string, string>()

/** The current notes of a drawing — read live by the context ledger (sub-agents write the same map). */
export function getNotes(drawingId: unknown): string {
  return notesByDrawing.get(String(drawingId)) ?? ''
}

// set/append acknowledge with the size only: the text already sits in the call's
// input, and echoing up to 8k chars back doubled every notes update in the context.
const ack = (text: string) => ({ result: { ok: true, chars: text.length, limit: MAX_NOTES_CHARS } })

export const notes: ToolHandler = async (input, ctx) => {
  const { action, text } = input as { action?: string; text?: string }
  const key = String(ctx.drawingId)
  const current = notesByDrawing.get(key) ?? ''

  switch (action) {
    case 'set': {
      const next = (text ?? '').slice(0, MAX_NOTES_CHARS)
      notesByDrawing.set(key, next)
      return ack(next)
    }
    case 'append': {
      const next = (current ? current + '\n' : '') + (text ?? '')
      if (next.length > MAX_NOTES_CHARS) {
        return {
          error: `Notes would exceed ${MAX_NOTES_CHARS} chars. Rewrite them compactly with action "set" — notes are a current-state scratchpad, not a log.`,
        }
      }
      notesByDrawing.set(key, next)
      return ack(next)
    }
    case 'get':
    case undefined:
      return { result: { notes: current } }
    default:
      return { error: `Unknown action "${action}". Use "get", "set", or "append".` }
  }
}
