// ─── run_script — execute model-written JavaScript against the CAD API ────────
//
// CAD construction is mostly COMPUTATION (trigonometry, coordinate chains, loops
// over repeated features). Emitting one tool call per API operation forces the
// model to evaluate all of that arithmetic in its head and inline the literals —
// the dominant failure mode on non-trivial builds. This tool lets the model write
// a real program instead: variables, Math, loops, functions, and direct await-able
// API calls, executed app-side in one round-trip.
//
// Trust boundary: the script runs with exactly the capabilities the model already
// has through call_api (every v1/buerli method on the live drawing) — it adds
// compute, not reach. Browser globals (window/document/fetch/…) are shadowed as a
// guard against accidental use; this is defense-in-depth, not a security sandbox.

import { createApi, BuerliCadFacade } from '@buerli.io/classcad'
import { getDrawing } from '@buerli.io/core'
import type { ToolExecutorContext, ToolResult } from '../types'
import { toErrorMessage, capJson } from './utils'

const MAX_LOG_ENTRIES = 300
const MAX_LOG_CHARS = 16000
const MAX_RESULT_CHARS = 24000
const DEFAULT_TIMEOUT_MS = 60000
const MAX_TIMEOUT_MS = 300000

// Browser globals shadowed to `undefined` inside the script scope. Scripts drive
// the CAD API — they have no business touching the page or the network.
const SHADOWED_GLOBALS = [
  'window', 'document', 'self', 'top', 'parent', 'frames', 'opener',
  'fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'navigator', 'location',
  'localStorage', 'sessionStorage', 'indexedDB', 'cookieStore',
  'alert', 'confirm', 'prompt', 'open', 'close', 'postMessage',
  'importScripts', 'Worker', 'SharedWorker', 'ServiceWorker',
  'require', 'process', 'module', 'exports',
]

/**
 * The API surface handed to scripts:
 *   api.v1.<domain>.<method>(args)  — ClassCAD (single object arg, wrapped result)
 *   api.<ns>.<method>(...args)      — buerli drawing APIs (structure, selection, …)
 *   api.facade.<method>(...args)    — session utils, current drawing auto-injected
 */
function buildScriptApi(drawingId: ToolExecutorContext['drawingId']): Record<string, unknown> {
  const api: Record<string, unknown> = {}
  const v1 = (createApi(drawingId) as any)?.v1
  if (v1) api.v1 = v1

  const drawingApi = (getDrawing(drawingId) as any)?.api ?? {}
  for (const key of Object.keys(drawingApi)) {
    const val = drawingApi[key]
    if (val && typeof val === 'object' && !(key in api)) api[key] = val
  }

  // facade.utils methods (except connect) take the drawing id first — inject it,
  // mirroring the call_api behavior, so scripts and single calls stay consistent.
  const utils = (BuerliCadFacade as any)?.utils
  if (utils && typeof utils === 'object') {
    const facade: Record<string, unknown> = {}
    for (const key of Object.getOwnPropertyNames(utils)) {
      const val = utils[key]
      if (typeof val !== 'function') continue
      facade[key] = key === 'connect' ? val.bind(utils) : (...args: unknown[]) => val.call(utils, drawingId, ...args)
    }
    api.facade = facade
  }
  return api
}

export async function runScriptHandler(
  input: Record<string, unknown>,
  ctx: ToolExecutorContext,
): Promise<ToolResult> {
  const { script, timeoutMs } = input as { script?: string; timeoutMs?: number }
  if (!script || typeof script !== 'string') {
    return { error: 'run_script expects a "script" string containing JavaScript code.' }
  }

  const api = buildScriptApi(ctx.drawingId)

  // Captured console — returned to the model alongside the script's return value.
  const logs: string[] = []
  let logChars = 0
  const capture = (level: string) => (...args: unknown[]) => {
    if (logs.length >= MAX_LOG_ENTRIES || logChars >= MAX_LOG_CHARS) return
    const line =
      (level === 'log' ? '' : `[${level}] `) +
      args.map(a => (typeof a === 'string' ? a : capJson(a, 2000))).join(' ')
    logs.push(line)
    logChars += line.length
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
    fn = new AsyncFunction('api', 'console', 'log', ...SHADOWED_GLOBALS, `'use strict';\n${script}`)
  } catch (e) {
    return { error: `Script syntax error: ${toErrorMessage(e)}` }
  }

  const timeout = Math.min(Math.max(timeoutMs ?? DEFAULT_TIMEOUT_MS, 1000), MAX_TIMEOUT_MS)
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    const shadowValues = SHADOWED_GLOBALS.map(() => undefined)
    const run = fn(api, consoleShim, consoleShim.log, ...shadowValues)
    const returned = await Promise.race([
      run,
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`Script exceeded ${timeout}ms (awaited work still pending). Split it into smaller scripts.`)),
          timeout,
        )
      }),
    ])
    return {
      result: {
        returned: returned === undefined ? null : JSON.parse(capSafe(returned)),
        logs,
      },
    }
  } catch (e) {
    const logTail = logs.length ? `\nConsole output before the error:\n${logs.slice(-20).join('\n')}` : ''
    return { error: `Script failed: ${toErrorMessage(e)}${logTail}` }
  } finally {
    if (timer) clearTimeout(timer)
  }
}

// Cap the returned value; keep it JSON so the tool result stays structured.
// capJson may append a truncation marker that breaks JSON.parse — wrap as string then.
function capSafe(value: unknown): string {
  const s = capJson(value, MAX_RESULT_CHARS)
  try {
    JSON.parse(s)
    return s
  } catch {
    return JSON.stringify(s)
  }
}
