// ─── Context overflow — recognising "the prompt did not fit" ──────────────────
//
// An overflow must not be retried as is (the same oversized payload fails again,
// and gateways multiply the upload). It is answered by compacting hard and
// retrying once. Signatures come from the providers' public error formats.

type MaybeProviderError = { status?: number; body?: string; message?: string }

const OVERFLOW_TEXT =
  /context[ _]length[ _]exceeded|maximum context length|context window|prompt is too long|input length and .?max_tokens.? exceed|exceeds? the (model'?s? )?(maximum |max )?(context|limit of \d+)|model_max_prompt_tokens_exceeded|prompt token count of \d+ exceeds|too many (input )?tokens|reduce the length|request_too_large|context_window_exceeded/i

/**
 * @param fullness estimated prompt size as a fraction of the known limit — lets a
 *   bare "400 Bad Request" (Copilot often sends nothing more) count as overflow
 *   when the context is evidently near the limit.
 */
export function isContextOverflow(e: unknown, fullness = 0): boolean {
  const err = (e ?? {}) as MaybeProviderError
  const text = `${err.body ?? ''} ${err.message ?? ''}`
  if (OVERFLOW_TEXT.test(text)) return true
  if (err.status === 413) return true
  if (err.status === 400 && fullness >= 0.85) {
    const body = (err.body ?? '').trim()
    return body.length < 40 || /^bad request$/i.test(body)
  }
  return false
}

/** The limit a provider names in its overflow message, if any ("maximum context length is 32768 tokens"). */
export function parseLimitFromError(e: unknown): number | undefined {
  const err = (e ?? {}) as MaybeProviderError
  const text = `${err.body ?? ''} ${err.message ?? ''}`
  const m =
    text.match(/maximum context length (?:is|of) (\d{3,8})/i) ??
    text.match(/exceeds the limit of (\d{3,8})/i) ??
    text.match(/context window (?:is|of) (\d{3,8})/i) ??
    text.match(/> (\d{3,8}) maximum/i)
  const n = m ? Number(m[1]) : NaN
  return Number.isFinite(n) && n >= 1000 ? n : undefined
}
