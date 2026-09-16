/** Shared, transport-independent request lifetime and complete-frame rules. */
export class PendingRequests<T> extends Map<string, { resolve: (value: T) => void; reject: (error: Error) => void; at: number }> {
  private timers = new Map<string, ReturnType<typeof setTimeout>>()
  register(id: string, entry: { resolve: (value: T) => void; reject: (error: Error) => void; at: number },
    options: { timeoutMs?: number; command: string; onTimeout: () => void }): void {
    this.set(id, entry)
    if (options.timeoutMs !== undefined) {
      const timer = setTimeout(() => {
        if (!this.has(id)) return
        this.delete(id)
        options.onTimeout()
        entry.reject(new Error(`Request timeout: ${options.command}; mutation outcome unknown, reconnect required`))
      }, options.timeoutMs)
      ;(timer as unknown as { unref?: () => void }).unref?.()
      this.timers.set(id, timer)
    }
  }
  override delete(id: string): boolean {
    const timer = this.timers.get(id)
    if (timer) clearTimeout(timer)
    this.timers.delete(id)
    return super.delete(id)
  }
  override clear(): void {
    for (const id of this.keys()) this.delete(id)
  }
  rejectAll(error: Error): void {
    for (const entry of this.values()) entry.reject(error)
    this.clear()
  }
}

/** Empty complete graphics replace the cache too; partial mutation graphics do not. */
export function completeGraphic(frame: any): { present: boolean; graphic: any } {
  const complete = frame._from_ === 'GetTree' || frame._from_ === 'Sync'
  return { present: complete && frame.graphic != null, graphic: frame.graphic ?? null }
}

export function normalizeResult(frame: any): any {
  let result = frame.result
  if (result && typeof result === 'object' && 'result' in result && Object.keys(result).length <= 3) result = result.result
  return { result, maxLevel: frame.maxLevel ?? 0,
    messages: (frame.messages ?? []).filter((m: any) => m.level > 31),
    structure: frame.structure ?? null, graphic: frame.graphic ?? null }
}

/** Temporary emission changes restore only changed keys, including when the pull fails. */
export async function withEmissionOverride<T>(session: {
  getEmissionConfig(): Promise<Record<string, unknown>>
  setEmissionConfig(config: Record<string, unknown>): Promise<unknown>
}, changes: Record<string, unknown>, run: () => Promise<T>): Promise<T> {
  const previous = await session.getEmissionConfig()
  const restore = Object.fromEntries(Object.keys(changes).filter(k => k in previous).map(k => [k, previous[k]]))
  await session.setEmissionConfig(changes)
  try { return await run() } finally { await session.setEmissionConfig(restore) }
}
