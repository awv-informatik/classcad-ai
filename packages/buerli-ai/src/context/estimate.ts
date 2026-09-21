// ─── Context size estimation ──────────────────────────────────────────────────
//
// The trigger for compaction is the provider's real `usage.inputTokens`; this
// module only estimates what was ADDED since the last call. Two things a plain
// char count gets badly wrong are handled explicitly:
//   - base64 image data is not text: an image costs a roughly constant number of
//     tokens, while its base64 is hundreds of thousands of chars;
//   - thinking blocks of earlier assistant messages are dropped by every provider
//     except Anthropic's current tool-use turn, so only the last one counts.

import type { Message } from '../types'

/** Rough cost of one image block. */
export const IMAGE_TOKENS = 1500
/** Starting ratio until the first real usage number calibrates it (~3.6 chars per token). */
export const DEFAULT_TOKENS_PER_CHAR = 0.28
const MIN_TOKENS_PER_CHAR = 0.15
const MAX_TOKENS_PER_CHAR = 0.6

export type Units = { chars: number; images: number }

function blockUnits(block: unknown, countThinking: boolean): Units {
  if (block == null || typeof block !== 'object') return { chars: String(block ?? '').length, images: 0 }
  const b = block as { type?: string; text?: string; thinking?: string; input?: unknown; name?: string }
  if (b.type === 'image') return { chars: 0, images: 1 }
  if (b.type === 'text') return { chars: (b.text ?? '').length, images: 0 }
  if (b.type === 'thinking') return { chars: countThinking ? (b.thinking ?? '').length : 0, images: 0 }
  if (b.type === 'tool_use') {
    let input = ''
    try {
      input = JSON.stringify(b.input ?? {}) ?? ''
    } catch {
      /* unserializable input counts as empty */
    }
    return { chars: input.length + (b.name ?? '').length + 24, images: 0 }
  }
  try {
    return { chars: (JSON.stringify(block) ?? '').length, images: 0 }
  } catch {
    return { chars: 0, images: 0 }
  }
}

/** Size of one message as it goes on the wire. */
export function messageUnits(m: Message, countThinking = false): Units {
  const c: unknown = m.content
  if (typeof c === 'string') return { chars: c.length, images: 0 }
  if (!Array.isArray(c)) return { chars: 0, images: 0 }
  let chars = 0
  let images = 0
  for (const block of c) {
    const u = blockUnits(block, countThinking)
    chars += u.chars
    images += u.images
  }
  return { chars, images }
}

/** Size of a rendered message list. Thinking counts only in the last assistant message. */
export function measure(messages: Message[]): Units {
  let lastAssistant = -1
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'assistant') {
      lastAssistant = i
      break
    }
  }
  let chars = 0
  let images = 0
  messages.forEach((m, i) => {
    const u = messageUnits(m, i === lastAssistant)
    chars += u.chars
    images += u.images
  })
  return { chars, images }
}

export type Calibration = {
  /** Learned tokens per char for this provider/model. */
  tokensPerChar: number
  /** Chars that ride along on every call: system prompt and tool schemas. */
  fixedChars: number
}

export function tokensOf(units: Units, cal: Calibration): number {
  return Math.round(units.chars * cal.tokensPerChar + units.images * IMAGE_TOKENS)
}

/** Estimated prompt tokens for a rendered message list. */
export function estimateTokens(messages: Message[], cal: Calibration): number {
  const u = measure(messages)
  return tokensOf({ chars: u.chars + cal.fixedChars, images: u.images }, cal)
}

/**
 * Fold one real measurement into the calibration: the provider reported
 * `inputTokens` for exactly the message list `sent`.
 */
export function calibrate(cal: Calibration, inputTokens: number | undefined, sent: Message[]): Calibration {
  if (!inputTokens || inputTokens <= 0) return cal
  const u = measure(sent)
  const chars = u.chars + cal.fixedChars
  const textTokens = inputTokens - u.images * IMAGE_TOKENS
  if (chars < 2000 || textTokens <= 0) return cal
  const observed = Math.min(MAX_TOKENS_PER_CHAR, Math.max(MIN_TOKENS_PER_CHAR, textTokens / chars))
  // Smooth a little: a single odd round (cached prefix, provider rounding) should not swing the trigger.
  return { ...cal, tokensPerChar: cal.tokensPerChar * 0.4 + observed * 0.6 }
}
