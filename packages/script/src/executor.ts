// runScript — execute model-written JavaScript against a session's api.
//
// The script runs as an async function body: `await api.v1.*` directly,
// `console.log`/`log(...)` captured, `return <value>` for the data to hand
// back. Environment globals (window/fetch/process/…) are shadowed — scripts
// drive the CAD API, nothing else. This is defense-in-depth against
// accidental use, not a security sandbox: the script already holds the full
// CAD API, which is the actual capability boundary.

import { buildScriptApi } from './api.js'
import { suppressEmission } from './emission.js'
import type { RunScriptOptions, RunScriptResult, ScriptSession } from './types.js'

const activeRuns = new WeakSet<object>()
export function isSessionBusy(session: ScriptSession): boolean {
  return activeRuns.has(session.executionKey ?? session)
}

const DEFAULT_TIMEOUT_MS = 60_000
const MAX_TIMEOUT_MS = 300_000

// Shadowed in BOTH environments (undefined inside the script scope). Includes
// the browser surface and the Node surface so a script cannot depend on either.
const SHADOWED_GLOBALS = [
  'window', 'document', 'self', 'top', 'parent', 'frames', 'opener', 'globalThis',
  'fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'navigator', 'location',
  'localStorage', 'sessionStorage', 'indexedDB', 'cookieStore',
  'alert', 'confirm', 'prompt', 'open', 'close', 'postMessage',
  'importScripts', 'Worker', 'SharedWorker', 'ServiceWorker',
  'require', 'process', 'module', 'exports', '__dirname', '__filename',
]

/** JSON-stringify with a hard cap; truncation is explicit, never silent. */
function capJson(value: unknown, maxChars: number): string {
  let s: string
  try {
    s = JSON.stringify(value) ?? 'null'
  } catch {
    s = String(value)
  }
  if (s.length <= maxChars) return s
  return (
    s.slice(0, maxChars) +
    `… [TRUNCATED — ${s.length} chars total. Return a smaller summary (filter/slice in the script).]`
  )
}

// Cap the returned value while keeping the tool result structured: if the
// truncation marker broke the JSON, hand the capped text back as a string.
function capReturned(value: unknown, maxChars: number): unknown {
  if (value === undefined) return null
  const s = capJson(value, maxChars)
  try {
    return JSON.parse(s)
  } catch {
    return s
  }
}

/**
 * Execute a script against a session. Never throws — syntax errors, runtime
 * errors and timeouts come back as `{ ok: false, error, logs }` with the
 * captured console output preserved (printf debugging survives failure).
 */
export async function runScript(
  code: string,
  session: ScriptSession,
  opts: RunScriptOptions = {},
): Promise<RunScriptResult> {
  const maxLogEntries = opts.maxLogEntries ?? 300
  const maxLogChars = opts.maxLogChars ?? 16_000
  const maxResultChars = opts.maxResultChars ?? 24_000

  if (!code || typeof code !== 'string') {
    return { ok: false, error: 'runScript expects a JavaScript source string.', logs: [] }
  }

  const key = session.executionKey ?? session
  if (activeRuns.has(key)) return { ok: false, pending: true, error: 'Session busy: previous work is unresolved; do not retry mutations.', logs: [] }
  let cancelled = false
  const guard = () => { if (cancelled || opts.signal?.aborted) throw new Error('Run cancelled; no further CAD calls permitted') }
  const guardNamespace = (value: any): any => {
    if (!value || (typeof value !== 'object' && typeof value !== 'function')) return value
    return new Proxy(value, {
      get: (target, prop) => guardNamespace(Reflect.get(target, prop)),
      apply: (target, receiver, args) => { guard(); return Reflect.apply(target, receiver, args) },
    })
  }
  const api = guardNamespace(buildScriptApi(session, opts))

  const logs: string[] = []
  let logChars = 0
  const capture = (level: string) => (...args: unknown[]) => {
    const line =
      (level === 'log' ? '' : `[${level}] `) +
      args.map(a => (typeof a === 'string' ? a : capJson(a, 2000))).join(' ')
    const bounded = line.slice(-maxLogChars)
    logs.push(bounded)
    logChars += bounded.length
    while (logs.length > maxLogEntries || logChars > maxLogChars) logChars -= logs.shift()!.length
  }
  const consoleShim = {
    log: capture('log'),
    info: capture('info'),
    warn: capture('warn'),
    error: capture('error'),
    debug: capture('debug'),
  }

  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor as new (
    ...args: string[]
  ) => (...fnArgs: unknown[]) => Promise<unknown>

  let fn: (...fnArgs: unknown[]) => Promise<unknown>
  try {
    // The user code runs in an INNER async scope so its own declarations may
    // freely shadow the shadowed globals (`const top = …`, `const parent = …`
    // must not collide with the sandbox parameters — observed live in the
    // browser host). Bare assignment to a shadowed name hits the harmless
    // outer parameter instead of the real global.
    fn = new AsyncFunction('api', 'console', 'log', ...SHADOWED_GLOBALS, `'use strict';\nreturn (async () => {\n${code}\n})();`)
  } catch (e) {
    return { ok: false, error: `Script syntax error: ${e instanceof Error ? e.message : String(e)}`, logs }
  }

  const timeout = Math.min(Math.max(opts.timeoutMs ?? DEFAULT_TIMEOUT_MS, 1000), MAX_TIMEOUT_MS)
  const startedAt = Date.now()
  let timer: ReturnType<typeof setTimeout> | undefined
  let onAbort: (() => void) | undefined
  activeRuns.add(key)
  // The lease belongs to the actual work, not the caller's waiting period.
  const work = (async () => {
    let restore = async () => {}
    try {
      guard()
      restore = opts.suppressEmission === false ? restore : await suppressEmission(session)
      guard()
      const invoke = () => fn(api, consoleShim, consoleShim.log, ...SHADOWED_GLOBALS.map(() => undefined))
      return await (session.withRunScope ? session.withRunScope(invoke) : invoke())
    } finally {
      try { await restore() } finally { activeRuns.delete(key) }
    }
  })()
  try {
    const returned = await Promise.race([
      work,
      new Promise<never>((_, reject) => {
        const stop = (message: string) => { cancelled = true; reject(new Error(message)) }
        timer = setTimeout(() => stop(`Script exceeded ${timeout}ms; in-flight work may still complete. Do not retry mutations until the session is idle.`), timeout)
        onAbort = () => stop('Script cancelled; in-flight work may still complete.')
        opts.signal?.addEventListener('abort', onAbort, { once: true })
        if (opts.signal?.aborted) onAbort()
      }),
    ])
    return { ok: true, returned: capReturned(returned, maxResultChars), logs, durationMs: Date.now() - startedAt }
  } catch (e) {
    return { ok: false, pending: activeRuns.has(key), error: `Script failed: ${e instanceof Error ? e.message : String(e)}`, logs, durationMs: Date.now() - startedAt }
  } finally {
    if (timer) clearTimeout(timer)
    if (onAbort) opts.signal?.removeEventListener('abort', onAbort)
  }
}
