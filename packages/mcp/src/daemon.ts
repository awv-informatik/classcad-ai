#!/usr/bin/env node
// daemon.ts — the one ClassCAD MCP process per machine.
//
// Why a daemon: stdio MCP servers are child processes of their host, one per
// Claude tab. That was fine while the MCP was only a WebSocket client of a
// ClassCAD worker. With the app bridge it also LISTENS (apps announce share
// tokens on ws://127.0.0.1:9096/bridge), and a listening port belongs to
// exactly one process — a second tab would either fail to bind or, worse,
// bind the other address family of "localhost" and receive half the apps.
//
// So the MCP itself is a thin stdio shim (server.ts) that finds or starts
// this daemon and forwards its host's JSON-RPC to it over HTTP (MCP
// Streamable HTTP transport). The daemon holds:
//   • the single bridge listener,
//   • one MCP server instance PER SESSION — every tab gets its own engine
//     client, emission config, caches and tool queue (mcp-server.ts),
//   • an idle timer: with no sessions and no app attached it exits by itself
//     (a Drogon-only user never notices it; a WASM user has it running while
//     a tab is shared).
//
// HTTP surface (127.0.0.1 only; requests with an Origin header or a
// non-loopback Host are refused with 403 — no browser may drive it):
//   GET  /health   → { name:'classcad-mcp', version, build, pid, sessions, apps, bridge, bridgeListen, logFile, uptimeMs }
//   POST /shutdown → exits when no session is active (409 otherwise);
//                    ?drain=1 → stops taking NEW sessions (503) and exits as
//                    soon as the current ones are gone (a newer build waits)
//   POST/GET/DELETE /mcp → MCP Streamable HTTP (session id in mcp-session-id)
// A shim may pass `x-classcad-ws-url` on its initialize request to choose the
// worker URL for that session (defaults to the daemon's CLASSCAD_WS_URL).

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { randomUUID } from 'node:crypto'
import { appendFileSync, mkdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { createMcpServer, DEFAULT_WS_URL, VERSION } from './mcp-server.js'
import { startBridgeServer, type BridgeRegistry } from './bridge/server.js'
import type { Client, EnginePolicy } from './client.js'
import { wasmOptionsFromEnv, type LocalWasmOptions } from './engine/wasm.js'
import { DEFAULT_DAEMON_PORT } from './ports.js'

export const DAEMON_HOST = '127.0.0.1'

/** Code the daemon loads besides its own dist: a rebuild of any of them is a new build. */
const BUILD_DEPENDENCIES = ['@classcad/renderer/node', '@classcad/script']

/**
 * Build stamp of the daemon code: the newest mtime of daemon.js and the
 * workspace packages it runs (renderer, script). The package version only
 * changes on releases; during development every `npm run build` must make the
 * next shim replace a running (idle) daemon, so /health reports the stamp the
 * daemon STARTED with and the shim compares it with the files on disk now.
 */
export function daemonBuildStamp(): string {
  // Test hook: lets the daemon contract simulate "another build".
  if (process.env.CLASSCAD_MCP_BUILD) return process.env.CLASSCAD_MCP_BUILD
  const files = [import.meta.url]
  for (const dep of BUILD_DEPENDENCIES) {
    try {
      files.push(import.meta.resolve(dep))
    } catch {
      /* not resolvable from here: only daemon.js counts */
    }
  }
  let newest = 0
  for (const file of files) {
    try {
      newest = Math.max(newest, statSync(fileURLToPath(file)).mtimeMs)
    } catch {
      /* missing file: ignore */
    }
  }
  return newest > 0 ? new Date(newest).toISOString() : 'unknown'
}

const LOOPBACK_HOSTNAMES = new Set(['127.0.0.1', 'localhost', '[::1]'])

/**
 * Only local non-browser clients (the shims, curl, the CLI) may talk to the
 * daemon. Binding 127.0.0.1 keeps the network out but not web pages: a page can
 * fire simple requests at loopback, and DNS rebinding makes it same-origin.
 * Browsers always send Origin on POST and cross-origin requests, and a rebound
 * request carries the attacker's hostname in Host — reject both.
 */
function isLoopbackClient(req: IncomingMessage): boolean {
  if (req.headers.origin !== undefined) return false
  const host = req.headers.host
  if (!host) return false
  try {
    return LOOPBACK_HOSTNAMES.has(new URL(`http://${host}`).hostname)
  } catch {
    return false
  }
}

export { DEFAULT_DAEMON_PORT }
export const DEFAULT_BRIDGE_LISTEN = 'ws://127.0.0.1:9096/bridge'
/** Exit after this long without any session (ms). */
export const DEFAULT_IDLE_MS = 60_000
/** Retry interval when the bridge port is taken (ms). */
const BRIDGE_RETRY_MS = 5_000

export type DaemonOptions = {
  port?: number
  wsUrl?: string
  bridgeListen?: string
  idleMs?: number
  /** Where to log (a file path); undefined = stderr. */
  logFile?: string
  /** Default engine policy for sessions that do not name one. */
  engine?: EnginePolicy
  /** Default local WASM settings (a session may pass its own key/origin in headers). */
  wasm?: LocalWasmOptions | null
}

export type DaemonHandle = { url: string; port: number; close: () => Promise<void> }

type Session = { transport: StreamableHTTPServerTransport; server: McpServer; client: Client; createdAt: number }

function makeLog(logFile?: string): (msg: string) => void {
  if (!logFile) return msg => process.stderr.write(`[classcad-mcp daemon] ${msg}\n`)
  try {
    mkdirSync(dirname(logFile), { recursive: true })
  } catch {
    /* best effort */
  }
  return msg => {
    try {
      appendFileSync(logFile, `${new Date().toISOString()} ${msg}\n`)
    } catch {
      /* never fail on logging */
    }
  }
}

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', c => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)))
    req.on('end', () => {
      if (chunks.length === 0) return resolve(undefined)
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
      } catch (e) {
        reject(e)
      }
    })
    req.on('error', reject)
  })
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const text = JSON.stringify(body)
  res.writeHead(status, { 'content-type': 'application/json', 'content-length': Buffer.byteLength(text) })
  res.end(text)
}

/** Starts the daemon; resolves once the HTTP port is bound. Rejects (EADDRINUSE etc.) otherwise. */
export async function startDaemon(opts: DaemonOptions = {}): Promise<DaemonHandle> {
  const port = opts.port ?? DEFAULT_DAEMON_PORT
  const wsUrl = opts.wsUrl ?? DEFAULT_WS_URL
  const bridgeListen = opts.bridgeListen ?? DEFAULT_BRIDGE_LISTEN
  const idleMs = opts.idleMs ?? DEFAULT_IDLE_MS
  const log = makeLog(opts.logFile)
  const startedAt = Date.now()
  // Taken once: the code this process runs, not whatever a later build left on disk.
  const build = daemonBuildStamp()

  // The bridge listener: one per machine, hence one per daemon. Apps announce
  // their share tokens here; sessions attach to them through the registry.
  // If the port is taken (typically an MCP of the previous, pre-daemon build
  // that a still-open tab keeps alive) the daemon runs without a bridge and
  // keeps retrying: as soon as the old process is gone the listener comes up,
  // no restart needed.
  let bridgeRegistry: BridgeRegistry | null = null
  let bridgeRetry: ReturnType<typeof setTimeout> | null = null
  let closing = false
  // Draining: a newer build asked us to go. Existing sessions run to their
  // end, new ones are refused, exit right after the last one closes.
  let draining = false
  const bindBridge = async () => {
    try {
      bridgeRegistry = await startBridgeServer({ listen: bridgeListen, log })
      log(`bridge listener on ${bridgeRegistry.url}`)
    } catch (err) {
      log(`bridge listener failed (${bridgeListen}): ${err instanceof Error ? err.message : err} — retrying every ${BRIDGE_RETRY_MS / 1000}s`)
      if (!closing) bridgeRetry = setTimeout(() => void bindBridge(), BRIDGE_RETRY_MS)
    }
  }
  await bindBridge()

  const sessions = new Map<string, Session>()
  let idleTimer: ReturnType<typeof setTimeout> | null = null

  // "Idle" = no MCP session AND no app holding a bridge connection. A shared
  // WASM tab counts as use: its bridge must stay up so the next tab's
  // use_session attaches at once instead of waiting for the app's reconnect
  // backoff. The registry has no change event, so the timer re-checks itself.
  const appCount = () => bridgeRegistry?.list().length ?? 0
  const armIdle = () => {
    if (idleTimer) clearTimeout(idleTimer)
    idleTimer = setTimeout(() => {
      if (closing || sessions.size > 0) return
      if (appCount() > 0) {
        armIdle()
        return
      }
      log(`idle for ${idleMs} ms with no sessions and no apps — exiting`)
      void shutdown(0)
    }, idleMs)
  }
  const disarmIdle = () => {
    if (idleTimer) clearTimeout(idleTimer)
    idleTimer = null
  }

  const dropSession = (id: string, why: string) => {
    const s = sessions.get(id)
    if (!s) return
    sessions.delete(id)
    try {
      s.client.close()
    } catch {
      /* already closed */
    }
    log(`session ${id} closed (${why}); ${sessions.size} left`)
    if (sessions.size === 0) {
      if (draining) {
        log('drained — exiting for the newer build')
        setTimeout(() => void shutdown(0), 50)
      } else armIdle()
    }
  }

  const httpServer = createServer(async (req, res) => {
    try {
      if (!isLoopbackClient(req)) {
        log(`refused ${req.method} ${req.url} (host ${req.headers.host ?? '-'}, origin ${req.headers.origin ?? '-'})`)
        sendJson(res, 403, { error: 'forbidden: local non-browser clients only' })
        return
      }
      const url = new URL(req.url ?? '/', `http://${DAEMON_HOST}`)
      if (url.pathname === '/health') {
        sendJson(res, 200, {
          name: 'classcad-mcp',
          version: VERSION,
          build,
          pid: process.pid,
          sessions: sessions.size,
          draining,
          apps: appCount(),
          bridge: bridgeRegistry?.url ?? null,
          bridgeListen,
          logFile: opts.logFile ?? null,
          uptimeMs: Date.now() - startedAt,
        })
        return
      }
      if (url.pathname === '/shutdown' && req.method === 'POST') {
        if (sessions.size > 0) {
          if (url.searchParams.get('drain') === '1') {
            draining = true
            log(`draining: ${sessions.size} session(s) keep running, no new ones; exit when they are gone`)
            sendJson(res, 202, { ok: true, draining: true, sessions: sessions.size })
            return
          }
          sendJson(res, 409, { ok: false, sessions: sessions.size, error: 'sessions active' })
          return
        }
        sendJson(res, 200, { ok: true })
        log('shutdown requested')
        setTimeout(() => void shutdown(0), 50)
        return
      }
      if (url.pathname !== '/mcp') {
        sendJson(res, 404, { error: 'not found' })
        return
      }

      const sid = typeof req.headers['mcp-session-id'] === 'string' ? (req.headers['mcp-session-id'] as string) : undefined
      if (sid) {
        const s = sessions.get(sid)
        if (!s) {
          sendJson(res, 404, { jsonrpc: '2.0', error: { code: -32001, message: 'Session not found' }, id: null })
          return
        }
        const body = req.method === 'POST' ? await readJsonBody(req) : undefined
        await s.transport.handleRequest(req, res, body)
        return
      }
      if (req.method !== 'POST') {
        sendJson(res, 400, { jsonrpc: '2.0', error: { code: -32000, message: 'Bad request: no session' }, id: null })
        return
      }
      const body = await readJsonBody(req)
      if (!isInitializeRequest(body)) {
        // A session starts with `initialize`. Anything else without a session
        // (e.g. a `server/discover` probe) is not a method this endpoint has:
        // say so with the request's id, so the caller can fall back.
        const first = (body ?? {}) as { id?: unknown; method?: unknown }
        const id = typeof first.id === 'string' || typeof first.id === 'number' ? first.id : null
        const error = typeof first.method === 'string'
          ? { code: -32601, message: `Method not found before initialize: ${first.method}` }
          : { code: -32000, message: 'Bad request: expected initialize' }
        sendJson(res, 400, { jsonrpc: '2.0', error, id })
        return
      }
      if (draining) {
        sendJson(res, 503, { jsonrpc: '2.0', error: { code: -32000, message: 'daemon is draining (a newer build is waiting)' }, id: null })
        return
      }

      // A new MCP session: its own server instance and engine client. The shim
      // may name the worker, the engine policy and the local-WASM key/origin it
      // was configured with (loopback headers; the daemon's own env is the default).
      const hdr = (name: string): string | undefined => {
        const v = req.headers[name]
        return typeof v === 'string' && v.length > 0 ? v : undefined
      }
      const sessionWsUrl = hdr('x-classcad-ws-url') ?? wsUrl
      const enginePolicy = (hdr('x-classcad-engine') as EnginePolicy | undefined) ?? opts.engine ?? 'auto'
      const key = hdr('x-classcad-wasm-key') ?? opts.wasm?.key
      const sessionWasm: LocalWasmOptions | null = key
        ? { ...(opts.wasm ?? { key }), key, origin: hdr('x-classcad-wasm-origin') ?? opts.wasm?.origin }
        : null
      const sessionLog = (msg: string) => log(`[${transport.sessionId ?? 'new'}] ${msg}`)
      const { server, client } = await createMcpServer({ wsUrl: sessionWsUrl, bridge: () => bridgeRegistry, engine: enginePolicy, wasm: sessionWasm, log: sessionLog })
      const transport: StreamableHTTPServerTransport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: id => {
          disarmIdle()
          sessions.set(id, { transport, server, client, createdAt: Date.now() })
          log(`session ${id} opened (worker ${sessionWsUrl}, engine ${enginePolicy}, local wasm ${sessionWasm ? 'available' : 'no key'}); ${sessions.size} active`)
        },
      })
      transport.onclose = () => {
        if (transport.sessionId) dropSession(transport.sessionId, 'transport closed')
      }
      await server.connect(transport)
      await transport.handleRequest(req, res, body)
    } catch (err) {
      log(`request failed: ${err instanceof Error ? err.stack ?? err.message : err}`)
      if (!res.headersSent) sendJson(res, 500, { error: err instanceof Error ? err.message : String(err) })
      else res.end()
    }
  })

  await new Promise<void>((resolve, reject) => {
    httpServer.once('error', reject)
    httpServer.listen(port, DAEMON_HOST, () => {
      httpServer.off('error', reject)
      resolve()
    })
  })
  const url = `http://${DAEMON_HOST}:${port}`
  log(`daemon ${VERSION} pid ${process.pid} listening on ${url}`)
  armIdle()

  const shutdown = async (code: number) => {
    if (closing) return
    closing = true
    disarmIdle()
    if (bridgeRetry) clearTimeout(bridgeRetry)
    for (const [id] of sessions) dropSession(id, 'daemon shutdown')
    if (bridgeRegistry) await bridgeRegistry.close().catch(() => {})
    await new Promise<void>(r => httpServer.close(() => r()))
    log('stopped')
    if (process.env.CLASSCAD_MCP_DAEMON === '1') process.exit(code)
  }
  process.once('SIGINT', () => void shutdown(0))
  process.once('SIGTERM', () => void shutdown(0))

  return { url, port, close: () => shutdown(0) }
}

/** Default log file of a detached daemon (stderr is not connected then). */
export function defaultDaemonLogFile(): string {
  return join(tmpdir(), 'classcad-mcp', 'daemon.log')
}

// Run directly: `node dist/daemon.js` (what the shim spawns, detached).
const isMain = (() => {
  try {
    return process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1]
  } catch {
    return false
  }
})()
if (isMain) {
  const port = Number(process.env.CLASSCAD_MCP_PORT ?? DEFAULT_DAEMON_PORT)
  startDaemon({
    port,
    wsUrl: process.env.CLASSCAD_WS_URL,
    bridgeListen: process.env.CLASSCAD_BRIDGE_LISTEN,
    idleMs: process.env.CLASSCAD_DAEMON_IDLE_MS ? Number(process.env.CLASSCAD_DAEMON_IDLE_MS) : undefined,
    logFile: process.env.CLASSCAD_MCP_LOG ?? (process.env.CLASSCAD_MCP_DAEMON === '1' ? defaultDaemonLogFile() : undefined),
    engine: process.env.CLASSCAD_ENGINE as EnginePolicy | undefined,
    wasm: wasmOptionsFromEnv(),
  }).catch(err => {
    // Typically EADDRINUSE: another daemon won the race, or a foreign program
    // holds the port. The shim polls /health and decides what to do.
    process.stderr.write(`[classcad-mcp daemon] cannot start on ${DAEMON_HOST}:${port}: ${err?.message ?? err}\n`)
    process.exit(3)
  })
}
