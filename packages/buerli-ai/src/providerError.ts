// ─── Provider request errors ──────────────────────────────────────────────────
//
// Providers throw this instead of a bare Error so the agent loop can tell a
// context overflow (compact + retry once) from a transient fault (retry as is)
// without parsing message strings.

export class ProviderRequestError extends Error {
  readonly status?: number
  readonly body?: string
  constructor(provider: string, status: number | undefined, body: string) {
    super(`${provider} request failed${status != null ? ` (${status})` : ''}: ${body}`)
    this.name = 'ProviderRequestError'
    this.status = status
    this.body = body
  }
}
