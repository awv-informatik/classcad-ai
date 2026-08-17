// ─── Shared tool helpers ──────────────────────────────────────────────────────

/**
 * ClassCAD/buerli often reject with a plain object (e.g. { type, text }) rather
 * than an Error, so `String(e)` would yield "[object Object]". Pull a human
 * message from the common fields, falling back to JSON so nothing is ever opaque.
 */
export function toErrorMessage(e: unknown): string {
  if (e == null) return 'Unknown error'
  if (typeof e === 'string') return e
  if (e instanceof Error) return e.message
  if (typeof e === 'object') {
    const o = e as Record<string, unknown>
    for (const k of ['message', 'text', 'error', 'reason', 'detail']) {
      if (typeof o[k] === 'string' && o[k]) return o[k] as string
    }
    try {
      return JSON.stringify(e)
    } catch {
      /* fall through */
    }
  }
  return String(e)
}

export function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const bin = atob(b64)
  const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
  return arr.buffer
}

/**
 * v1.common.save returns { result: { success: 1, content: '<base64>' }, … } when no
 * file/url is set. Pull the base64 from result.content (with defensive fallbacks).
 */
export function extractBase64(raw: unknown): string {
  const strip = (s: string) => s.replace(/^data:[^;]+;base64,/, '')
  if (typeof raw === 'string') return strip(raw)
  if (!raw || typeof raw !== 'object') return ''
  const o = raw as any
  const content = o.result?.content ?? o.content ?? o.result?.data ?? o.data ?? o.value
  if (typeof content === 'string') return strip(content)
  if (typeof o.result === 'string') return strip(o.result)
  return ''
}

/**
 * JSON-stringify a value with a hard size cap, so one oversized tool result can
 * never flood the model's context. Truncation is EXPLICIT (the marker says what
 * happened and how to get the data another way) — silent truncation would read
 * as complete data.
 */
export function capJson(value: unknown, maxChars: number): string {
  let s: string
  try {
    s = JSON.stringify(value) ?? 'null'
  } catch {
    s = String(value)
  }
  if (s.length <= maxChars) return s
  return (
    s.slice(0, maxChars) +
    `… [TRUNCATED — ${s.length} chars total. The full value was too large for context; ` +
    `query a smaller piece (filter/slice in a script) instead of re-requesting it whole.]`
  )
}
