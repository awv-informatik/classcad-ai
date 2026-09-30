import { PendingRequests, completeGraphic, normalizeResult, withEmissionOverride } from '@classcad/script'
// client.ts — ClassCAD WebSocket client (TS port of scripts/client.mjs).
//
// Connects to a Drogon WS server and exposes promise-based execute()/request()
// helpers plus a cached structure tree / graphic that MCP tools read.
//
// ── Emission model (per CONNECTION, suppression per SCRIPT) ──────────────────
// The engine keeps ONE CommandConfig per connection (a per-request `config`
// field is ignored). This client does NOT touch it on connect: the MCP may
// dock into a session shared with an interactive app (invite URL), and the
// server broadcasts what the ORIGINATOR of a command emits - a permanently
// suppressed MCP would mutate the model without the app ever seeing it. So
// the connection runs with the engine's defaults (full content, bundled);
// run_script suppresses payloads for the duration of ONE script (runScript
// in @classcad/script reads, switches, restores) and pulls once afterwards
// so the app and the caches converge.
//   • pull() → GetTree. The structure ALWAYS comes back (GetTree is an
//     explicit request); inside a suppressed script the pull switches
//     sendGraphic_Kernel on around it (PULL_GRAPHIC_ON) and back.
// Caches: a mutation counter makes them self-invalidating; a Result that
// carries the structure keeps the tree cache current without a pull, the
// complete graphic only ever comes from a pull.
//
// Supports reconnecting with a different ClassCAD-Session-Id header at runtime
// via reconnect(sessionId) — used by the use_session MCP tool.
//
// ── Three engines, one client ────────────────────────────────────────────────
//   ws     a ClassCAD worker (Drogon) over WebSocket - own session or a shared
//          one (?invite=). The default.
//   bridge an app's in-page WASM engine reached through the bridge listener
//          (?bridge= share link); commands are relayed to the page.
//   wasm   the MCP's OWN engine: the published WASM build hosted in a worker
//          thread of this process (engine/wasm.ts). Needs a key.
// Which one is used: a token/URL decides by itself (invite → ws, bridge →
// bridge). Without one the ENGINE POLICY applies (opts.engine / use_session's
// engine argument): 'auto' tries the worker first and falls back to the local
// WASM when the worker is not reachable; 'drogon' insists on the worker;
// 'wasm' goes local right away. The replies of both WASM paths have the same
// shape (messages + binary packages) and share one delivery path.

import WebSocket from 'ws'
import { randomUUID } from 'crypto'
import { connect as tcpConnect } from 'net'
import type { ApiResult, Graphic, Message, Structure } from './types.js'
import type { AppConnection, BridgeRegistry } from './bridge/server.js'
import type { EngineExecuteResult } from './bridge/protocol.js'
import { startLocalEngine, type LocalEngine, type LocalWasmOptions } from './engine/wasm.js'

export type EnginePolicy = 'auto' | 'drogon' | 'wasm'
export type Transport = 'ws' | 'bridge' | 'wasm'

const DEFAULT_URL = 'ws://0.0.0.0:9094/'
const REQUEST_TIMEOUT = 30_000
const CONNECT_TIMEOUT = 5_000
/** How often an 'auto' session that fell back to WASM looks for a worker again (ms). */
const WORKER_PROBE_MS = 3_000

/** True when something accepts TCP connections at the worker URL's host:port. */
function workerListening(url: string): Promise<boolean> {
  let host: string
  let port: number
  try {
    const u = new URL(url)
    host = u.hostname.replace(/^\[|\]$/g, '')
    port = Number(u.port || (u.protocol === 'wss:' ? 443 : 80))
  } catch {
    return Promise.resolve(false)
  }
  return new Promise(resolve => {
    const sock = tcpConnect({ host, port })
    const done = (ok: boolean) => {
      sock.destroy()
      resolve(ok)
    }
    sock.once('connect', () => done(true))
    sock.once('error', () => done(false))
    sock.setTimeout(500, () => done(false))
  })
}

/**
 * Around a graphic pull inside a suppressed script: kernel graphics only —
 * the content the renderer contract has always been built on. Switched back
 * right after the GetTree. (The suppression profile itself lives in
 * @classcad/script's emission.ts and is applied by runScript.)
 */
export const PULL_GRAPHIC_ON: Record<string, unknown> = { sendGraphic_Kernel: true }

type PendingEntry = {
  resolve: (r: ApiResult) => void
  reject: (e: Error) => void
  /** The model version this request's Result describes (cache bookkeeping). */
  at: number
}

type Id = number | string

export type ConnectOptions = {
  graphics?: boolean // default true — include kernel graphics in pulls
  requestTimeoutMs?: number
  connectTimeoutMs?: number
  debug?: boolean // default false — disables all timeouts
  sessionId?: string | null // optional — initial session id to send as ClassCAD-Session-Id header
  /** Accessor for the bridge registry (apps announcing share tokens); needed for reconnectBridge. */
  bridge?: () => BridgeRegistry | null
  /** Which engine to use when no token/URL decides it. Default 'auto'. */
  engine?: EnginePolicy
  /** Settings of the local WASM engine; null/undefined = no key = not available. */
  wasm?: LocalWasmOptions | null
  /** Where connection decisions are reported (stderr / daemon log). */
  log?: (msg: string) => void
}

/**
 * This release does not hand out OFB (the native, parametric format): the
 * commands that serialize to OFB — common.save and assembly.exportNode, whose
 * default format IS OFB — are refused whether the data would be returned,
 * written to a file or sent to a url. STEP/STL exports and loading OFB stay.
 * Returns the refusal message, or null when the task may run.
 */
export function ofbExportRefusal(task: object): string | null {
  for (const [command, args] of Object.entries(task)) {
    if (command !== 'v1.common.save' && command !== 'v1.assembly.exportNode') continue
    const params = (Array.isArray(args) ? args[0] : args) as { format?: unknown; file?: unknown } | undefined
    const fromFile = typeof params?.file === 'string' && /\.[a-z0-9]+$/i.test(params.file) ? params.file.split('.').pop() : undefined
    const format = String(params?.format ?? fromFile ?? 'OFB').toUpperCase()
    if (format === 'OFB')
      return `${command.slice(3)}: OFB export is not available in this release of the ClassCAD MCP. Export STEP (format: "STP") or STL instead; checkpoint/restore still work for rollback.`
  }
  return null
}

export type Client = {
  /** Raw request. Tracked as a potential mutation unless `opts.track === false`. */
  request: <T = unknown>(command: string, extra?: object, opts?: { track?: boolean }) => Promise<ApiResult<T>>
  /** One API task. OFB exports are refused (see ofbExportRefusal) unless `internalOfb` — the checkpoint's in-process save. */
  execute: <T = unknown>(task: object, opts?: { internalOfb?: boolean }) => Promise<ApiResult<T>>
  close: () => void
  /** Cached structure (as of the last pull). */
  getStructure: () => Structure | null
  /** Cached graphic (as of the last pull). */
  getLastGraphic: () => Graphic | null
  /** Structure tree, pulled only when stale (or `refresh`). */
  getTree: (o?: { refresh?: boolean }) => Promise<Structure['tree']>
  /** Graphic, pulled only when stale. `recalc: true` regenerates first (destroys entity-injection bodies). */
  getGraphic: (o?: { recalc?: boolean }) => Promise<Graphic | null>
  /** Forced pull of structure + graphic (GetTree, with the kernel graphic switched on around it). */
  pull: () => Promise<void>
  /** Effective per-connection emission config (server-side state). */
  getEmissionConfig: () => Promise<Record<string, unknown>>
  /** Merge `partial` into the connection config; returns the effective flags. Restore SUPPRESS_EMISSION when done. */
  setEmissionConfig: (partial: Record<string, unknown>) => Promise<Record<string, unknown>>
  /** @deprecated alias of pull() that returns the structure — kept for existing tools. */
  refreshTree: () => Promise<Structure | null>
  reconnect: (sessionId: string | null, engine?: EnginePolicy) => Promise<void>
  /** Reconnect to a DIFFERENT server URL — e.g. a multi-client token/invite URL (`wss://…/?invite=…`), used verbatim. */
  reconnectUrl: (url: string) => Promise<void>
  /**
   * Attach to an in-app engine (WASM) through the bridge: the app announced
   * `token` on the MCP's bridge listener; from then on every engine command
   * is relayed to the app (engine.execute) instead of a WebSocket worker.
   */
  reconnectBridge: (token: string) => Promise<void>
  /** 'ws' (a ClassCAD worker over WebSocket), 'bridge' (an app's in-page engine) or 'wasm' (the MCP's own engine). */
  readonly transport: Transport
  /** The engine policy in force when no token/URL decides ('auto' | 'drogon' | 'wasm'). */
  readonly engine: EnginePolicy
  /** True when a key for the local WASM engine is configured. */
  readonly wasmAvailable: boolean
  /** The running local engine, if any. */
  readonly localEngine: LocalEngine | null
  /** The share token this client joined with (invite or bridge token), or null. */
  readonly shareToken: string | null
  /** True while the engine link is usable. */
  readonly connected: boolean
  /** The configured worker URL (session-id reconnects always return to it). */
  readonly baseUrl: string
  /** Increments on every reconnect/reconnectUrl — cache invalidation key for per-session state. */
  readonly generation: number
  /** Tracked requests since the last (re)connect — cache-invalidation key for pulls. */
  readonly version: number
  readonly ws: WebSocket | undefined
  readonly sessionId: string | null
  readonly url: string
}

export async function connect(url: string = DEFAULT_URL, opts: ConnectOptions = {}): Promise<Client> {
  const graphics = opts.graphics !== false
  const debug = opts.debug === true
  let outcomeUnknown = false
  const pending = new PendingRequests<ApiResult>()
  // The URL is used VERBATIM — it may carry a multi-client token/invite query
  // (e.g. wss://host/?invite=…), in which case the server itself decides the
  // session. currentUrl is mutable (reconnectUrl switches servers at runtime);
  // baseUrl is the configured worker — session-id reconnects always return to it.
  const baseUrl = url
  let generation = 0
  let currentUrl = url

  let lastGraphic: Graphic | null = null
  let lastStructure: Structure | null = null
  // Cache bookkeeping: `version` bumps on every tracked request. treeVersion
  // is the version whose structure the tree cache holds (fed by every Result
  // that carries a structure snapshot - full emission - or by a pull);
  // graphicVersion the one the graphic cache holds (fed by pulls only).
  // Equal to `version` → current → no round trip.
  let version = 0
  let treeVersion = -1
  let graphicVersion = -1
  // Last known sendGraphic_Kernel of the connection (from every config echo);
  // null = never asked (engine default: on). pull() uses it to decide
  // whether the kernel graphic must be switched on for the GetTree.
  let knownKernel: boolean | null = null
  let ws: WebSocket | undefined = undefined
  // Tracks the *intended* session id. Starts as the value passed to connect()
  // (typically null) and is updated by reconnect(). It only becomes the
  // actual session id of the worker connection after openWs() succeeds.
  let currentSessionId: string | null = opts.sessionId ?? null
  // Single-flight guard so concurrent tool calls share one open attempt.
  let connectPromise: Promise<void> | null = null

  // ── Bridge transport (in-app engines) ──
  // Instead of a WebSocket to a worker, commands go to the app that announced
  // `bridgeToken` on the bridge listener; the app runs them on its WASM engine
  // and returns everything the engine emitted. The replies are normalized to
  // the worker's frame shape and fed through handleFrame like WS frames.
  let transport: Transport = 'ws'
  let bridgeConn: AppConnection | null = null
  // ── Local WASM engine (engine/wasm.ts) ──
  // Started on first use under the 'wasm' policy (or 'auto' with the worker
  // unreachable); kept for the client's lifetime — a restart costs seconds
  // and there is no other session to switch to. close() terminates it.
  let localEngine: LocalEngine | null = null
  let policy: EnginePolicy = opts.engine ?? 'auto'
  // 'auto' landed on the local engine because no worker answered. The order is
  // token > worker > WASM, so a worker that comes up later takes over — while
  // the drawing is still empty; after that, switching would lose the model.
  let autoFallback = false
  let lastWorkerProbe = 0
  let workerWaitingLogged = false
  let probing = false
  const wasmAvailable = () => !!opts.wasm?.key
  const log = opts.log ?? (() => {})
  let bridgeToken: string | null = null
  let bridgeUnsubClose: (() => void) | null = null
  let bridgePeerId: string | null = null
  // The invite token of a server session joined via reconnectUrl (?invite=…).
  let inviteToken: string | null = null
  // In-app engines emit graphic as binary packages per command (no bundled
  // graphic on GetTree). Accumulate containers by id so a pull can hand the
  // renderer the complete picture; the renderer drops consumed bodies itself.
  const bridgeContainers = new Map<string, any>()

  function send(obj: Record<string, unknown>): void {
    if (transport === 'bridge' || transport === 'wasm') {
      sendViaEngine(obj)
      return
    }
    if (!ws) throw new Error('WebSocket not open')
    ws.send(JSON.stringify(obj))
  }

  /** Bridge and local WASM: one request → everything the engine emitted for it. */
  function sendViaEngine(req: Record<string, unknown>): void {
    const txId = String(req.transactionID)
    let run: Promise<EngineExecuteResult>
    if (transport === 'wasm') {
      if (!localEngine) {
        const entry = pending.get(txId)
        pending.delete(txId)
        entry?.reject(new Error('local WASM engine is not running'))
        return
      }
      run = localEngine.execute(req)
    } else {
      const conn = bridgeConn
      if (!conn) {
        const entry = pending.get(txId)
        pending.delete(txId)
        entry?.reject(new Error('bridge not attached — call use_session with the app\'s share link'))
        return
      }
      run = conn.request<EngineExecuteResult>('engine.execute', req)
    }
    run.then(
      res => deliverEngineResult(req, res),
      err => {
        const entry = pending.get(txId)
        if (entry) {
          pending.delete(txId)
          entry.reject(err instanceof Error ? err : new Error(String(err)))
        }
      },
    )
  }

  /** Turns an engine reply (bridge or local WASM) into worker-shaped Result frames and delivers them. */
  function deliverEngineResult(req: Record<string, unknown>, res: EngineExecuteResult): void {
    const txId = String(req.transactionID)
    const fail = (why: string) => {
      const entry = pending.get(txId)
      if (entry) {
        pending.delete(txId)
        entry.reject(new Error(why))
      }
    }
    if (res.decodeErrors?.length) log(`${String(req.command)}: dropped undecodable engine output (${res.decodeErrors.join('; ')})`)
    for (const pkg of res.binaryMessages ?? []) {
      for (const c of (pkg as any)?.containers ?? []) {
        if (c && c.id != null) bridgeContainers.set(String(c.id), c)
      }
    }
    // Errors the engine reported on the side (ErrorMessage frames, errorState 2).
    const sideErrors = (res.messages ?? [])
      .filter(m => m?.command === 'ErrorMessage' && Number(m.attributes?.errorState) >= 2)
      .map(m => ({ level: 51, levelStr: 'ERROR', code: m.attributes?.errorCode ?? 0, message: String(m.attributes?.errorMessage ?? 'engine error') }))
    let delivered = false
    for (const m of res.messages ?? []) {
      if (m.command !== 'Result') continue
      const frame: Record<string, any> = {
        ...m,
        _from_: m._from_ ?? m.from ?? req.command,
        _transactionID_: m._transactionID_ ?? m.transactionID ?? req.transactionID,
      }
      if (frame._from_ === 'Execute') {
        // Every Execute Result carries a value (null included) or a level. One
        // with neither is not an answer — never let it pass as a success.
        if (!('result' in frame) && frame.maxLevel == null) {
          fail(`engine returned an empty Result for ${describeRequest(req)}`)
          return
        }
        // An error reported only as ErrorMessage must not turn into an empty success.
        const n = normalizeResult(frame)
        if (sideErrors.length && (n.maxLevel ?? 0) < 51 && n.result == null) {
          frame.maxLevel = 51
          frame.messages = [...(Array.isArray(frame.messages) ? frame.messages : []), ...sideErrors]
        }
      }
      if (frame._from_ === 'GetTree' || frame._from_ === 'Sync') {
        // Legacy engines put the structure into `result`; the WS worker puts it into `structure`.
        if (!frame.structure && frame.result && typeof frame.result === 'object' && 'tree' in frame.result) {
          frame.structure = frame.result
          delete frame.result
        }
        // A pull delivers the COMPLETE graphic: the accumulated containers.
        frame.graphic = { containers: [...bridgeContainers.values()] }
      }
      delivered = true
      handleFrame(Buffer.from(JSON.stringify(frame)), false)
    }
    if (!delivered) {
      const detail = [...sideErrors.map(e => e.message), ...(res.decodeErrors ?? [])]
      fail(`engine returned no Result for ${describeRequest(req)}${detail.length ? ` (${detail.join('; ')})` : ''}`)
    }
  }

  function describeRequest(req: Record<string, unknown>): string {
    const task = Array.isArray(req.task) ? (req.task[0] as Record<string, unknown> | undefined) : undefined
    const method = task ? Object.keys(task)[0] : undefined
    return method ? `${String(req.command)} ${method}` : String(req.command)
  }

  function detachBridge(): void {
    if (bridgeUnsubClose) bridgeUnsubClose()
    bridgeUnsubClose = null
    const conn = bridgeConn
    bridgeConn = null
    if (conn && bridgePeerId) {
      conn.request('session.detached', { peerId: bridgePeerId }).catch(() => {})
    }
    bridgePeerId = null
    bridgeToken = null
    bridgeContainers.clear()
  }

  function handleFrame(data: WebSocket.RawData, isBinary: boolean): void {
    if (isBinary) return
    let frame: any
    try {
      frame = JSON.parse(data.toString())
    } catch {
      return
    }
    const txId = frame._transactionID_
    if (!txId) return
    const entry = pending.get(txId)
    if (!entry) return
    if (frame.command !== 'Result') return
    pending.delete(txId)

    // A pull (GetTree/Sync) delivers the COMPLETE graphic — replace, never
    // merge (a merge would keep containers of deleted bodies alive). Graphic
    // on other Results covers only the changed ids and is ignored here.
    const complete = completeGraphic(frame)
    if (complete.present) {
      lastGraphic = complete.graphic
      graphicVersion = Math.max(graphicVersion, entry.at)
    }
    // Every structure snapshot is complete (the engine sends the whole tree).
    if (frame.structure && typeof frame.structure === 'object' && !Array.isArray(frame.structure)) {
      lastStructure = frame.structure as Structure
      treeVersion = Math.max(treeVersion, entry.at)
    }

    entry.resolve(normalizeResult(frame))
  }

  async function request<T = unknown>(command: string, extra: object = {}, o: { track?: boolean } = {}): Promise<ApiResult<T>> {
    if (outcomeUnknown) throw new Error('Session outcome unknown after request timeout; reconnect before further work')
    await ensureOpen()
    if (o.track !== false) version++
    const transactionID = randomUUID()
    return new Promise((resolve, reject) => {
      pending.register(transactionID, { resolve: resolve as (r: ApiResult) => void, reject, at: version }, { command, timeoutMs: debug ? undefined : opts.requestTimeoutMs ?? REQUEST_TIMEOUT, onTimeout: () => {
        // The local engine runs one command at a time on its own thread: one
        // that does not answer is stuck, and everything queued behind it with
        // it. Retire it — the next command starts a new one (empty drawing).
        if (transport === 'wasm' && localEngine && !localEngine.closed) {
          log(`local WASM engine did not answer ${command} within the request timeout — retired; the next command starts a new engine with an empty drawing`)
          localEngine.close(`did not answer ${command} within the request timeout`)
        } else outcomeUnknown = true
      } })
      // No emission flags travel with a request — the engine keeps them per
      // connection (see SUPPRESS_EMISSION / setEmissionConfig in openWs).
      try { send({ command, commandVersion: 'v1', transactionID, ...extra }) }
      catch (error) { pending.delete(transactionID); reject(error as Error) }

    })
  }

  // Open the WS lazily on first use. Single-flight: concurrent callers share
  // the in-flight open. After a successful open, ws stays defined; close()
  // and reconnect() reset it as needed.
  async function ensureOpen(): Promise<void> {
    if (transport === 'bridge') {
      if (bridgeConn) return
      throw new Error(
        'The app behind the share link is gone (bridge closed). Either reopen the share in the app and call use_session with the new link, ' +
          'or leave the app: use_session with engine "wasm" runs on the MCP\'s own local engine, engine "drogon" on the ClassCAD worker, "auto" picks.',
      )
    }
    if (transport === 'wasm' && localEngine?.closed) {
      if (connectPromise) return connectPromise
      connectPromise = restartLocalEngine(localEngine.deathReason ?? 'closed').finally(() => {
        connectPromise = null
      })
      return connectPromise
    }
    if (transport === 'wasm' && localEngine) {
      // Not single-flight on purpose: the probe itself reads the tree through
      // request() → ensureOpen(), which must pass straight through (probing).
      if (autoFallback && policy === 'auto' && !probing) {
        probing = true
        try {
          await preferWorker()
        } finally {
          probing = false
        }
      }
      return
    }
    if (transport === 'ws' && ws && ws.readyState === WebSocket.OPEN) return
    if (connectPromise) return connectPromise
    connectPromise = openByPolicy(policy, currentSessionId).finally(() => {
      connectPromise = null
    })
    return connectPromise
  }

  /**
   * Opens the engine the policy asks for. 'auto' = the worker, and when it
   * is not reachable (refused/timeout — not a failure AFTER connecting) the
   * local WASM engine, if a key is configured. Explicit session ids only
   * make sense on a worker: with one given, 'auto' does not fall back.
   */
  async function openByPolicy(how: EnginePolicy, sessionId: string | null): Promise<void> {
    autoFallback = false
    if (how === 'wasm') {
      if (!wasmAvailable()) throw new Error('No local WASM engine: set CLASSCAD_WASM_KEY (a ClassCAD key from classcad.ch/user) to let the MCP host the engine itself, or use engine "drogon" with a running ClassCAD worker.')
      await openWasm()
      return
    }
    try {
      await openWs(sessionId)
    } catch (err) {
      const unreachable = err instanceof Error && (err as Error & { connectFailure?: boolean }).connectFailure === true
      if (how === 'auto' && unreachable && !sessionId && wasmAvailable()) {
        log(`no ClassCAD worker at ${currentUrl} (${(err as Error).message || (err as { code?: string }).code || 'refused'}) — using the local WASM engine until one is up`)
        await openWasm()
        autoFallback = true
        lastWorkerProbe = Date.now()
        return
      }
      if (unreachable && how === 'auto' && !wasmAvailable()) {
        throw new Error(
          `No ClassCAD worker reachable at ${currentUrl} (${(err as Error).message}). Start one (classcad-cli worker) or set CLASSCAD_WS_URL — ` +
            'or set CLASSCAD_WASM_KEY so the MCP can host the engine itself (local WASM).',
        )
      }
      throw err
    }
  }

  /**
   * The 'auto' fallback, re-checked before commands (throttled): a worker that
   * is listening now takes over an EMPTY local drawing. MCP tool calls run
   * one at a time (queue.ts), so nothing else is mid-command on the engine.
   */
  async function preferWorker(): Promise<void> {
    const now = Date.now()
    if (now - lastWorkerProbe < WORKER_PROBE_MS) return
    lastWorkerProbe = now
    if (!(await workerListening(currentUrl))) return
    let empty = false
    try {
      const tree = await getTree({ refresh: true })
      empty = Object.values(tree).every((n: any) => n?.class === 'AllObjects')
    } catch {
      return
    }
    if (!empty) {
      if (!workerWaitingLogged) {
        log(`ClassCAD worker at ${currentUrl} is up, but this session's model lives on the local WASM engine — staying there (use_session engine "drogon" starts fresh on the worker)`)
        workerWaitingLogged = true
      }
      autoFallback = false
      return
    }
    try {
      await openWs(null)
      autoFallback = false
      log(`ClassCAD worker at ${currentUrl} is up — moved this (still empty) session from the local WASM engine to the worker`)
    } catch (err) {
      log(`worker at ${currentUrl} listens but did not open (${(err as Error).message}) — staying on the local WASM engine`)
      await openWasm()
    }
  }

  /** Switches this client to the MCP's own WASM engine (started on first use). */
  async function openWasm(): Promise<void> {
    if (ws && ws.readyState <= WebSocket.OPEN) {
      try {
        ws.close()
      } catch {}
      ws = undefined
    }
    if (transport === 'bridge') detachBridge()
    resetCaches()
    transport = 'wasm'
    currentSessionId = null
    inviteToken = null
    // A reused engine (use_session, the 'auto' fallback) must still answer;
    // a dead or wedged one is replaced by a new engine (empty drawing).
    if (localEngine && (localEngine.closed || !(await localEngine.ping()))) {
      const why = localEngine.deathReason ?? 'did not answer a health check'
      log(`local WASM engine ${why} — starting a new one (the drawing is lost)`)
      localEngine.close(why)
      localEngine = null
    }
    if (!localEngine) {
      localEngine = await startLocalEngine({ ...opts.wasm!, log })
      // A new engine has default database settings. Checkpoints (save
      // payloads held here) stay valid: restore loads them into this one.
      ensuredGeneration = -1
      await bootstrapSession()
    }
  }

  /** Replaces a retired local engine (crash, trap, timeout) with a new one. */
  async function restartLocalEngine(why: string): Promise<void> {
    log(`local WASM engine is gone (${why}) — starting a new one with an empty drawing`)
    localEngine?.close(why)
    localEngine = null
    await openWasm()
  }

  function execute<T = unknown>(task: object, opts: { internalOfb?: boolean } = {}): Promise<ApiResult<T>> {
    const refused = opts.internalOfb ? null : ofbExportRefusal(task)
    if (refused) return Promise.reject(new Error(refused))
    return request<T>('Execute', { task: [task], options: { undoable: false } })
  }

  function close(): void {
    if (transport === 'bridge') detachBridge()
    if (ws && ws.readyState <= WebSocket.OPEN) ws.close()
    if (localEngine) {
      localEngine.close()
      localEngine = null
    }
  }

  function getLastGraphic(): Graphic | null {
    return lastGraphic
  }
  function getStructure(): Structure | null {
    return lastStructure
  }

  // Per-connection emission config (untracked: it changes what the engine
  // SENDS, not the model). The reply carries the effective flags in `result`;
  // an engine without the commands answers without `result`. Nothing is set
  // on connect - run_script scopes the suppression to a script.
  function rememberKernel(cfg: Record<string, unknown> | undefined): Record<string, unknown> {
    if (cfg && typeof cfg.sendGraphic_Kernel === 'boolean') knownKernel = cfg.sendGraphic_Kernel
    return cfg as Record<string, unknown>
  }
  async function getEmissionConfig(): Promise<Record<string, unknown>> {
    return rememberKernel((await request('GetEmissionConfig', {}, { track: false })).result as Record<string, unknown>)
  }
  async function setEmissionConfig(partial: Record<string, unknown>): Promise<Record<string, unknown>> {
    return rememberKernel((await request('SetEmissionConfig', { config: partial }, { track: false })).result as Record<string, unknown>)
  }

  /**
   * Fill BOTH caches with one GetTree. Not tracked — it is not a mutation.
   * GetTree always returns the structure; inside a suppressed script the
   * kernel graphic is switched on around it and back to what it was.
   */
  async function pull(): Promise<void> {
    const at = version
    const toggle = graphics && knownKernel === false
    const read = async () => {
      await request('GetTree', {}, { track: false })
      graphicVersion = Math.max(graphicVersion, at)
    }
    if (toggle) await withEmissionOverride({ getEmissionConfig, setEmissionConfig }, PULL_GRAPHIC_ON, read)
    else await read()
  }
  const treeCurrent = () => treeVersion === version && lastStructure !== null
  // No null check on lastGraphic: a pull that delivered no graphic (graphics:false, empty model) is still current.
  const graphicCurrent = () => graphicVersion === version

  async function getTree(o?: { refresh?: boolean }): Promise<Structure['tree']> {
    if (o?.refresh || !treeCurrent()) await pull()
    return (lastStructure?.tree ?? {}) as Structure['tree']
  }

  // The engine omits brep EDGE data from graphic payloads until the graphic
  // database settings are enabled — ensure once per (re)connect generation.
  // Untracked: it changes engine settings, not the model.
  let ensuredGeneration = -1
  async function ensureGraphics(): Promise<void> {
    if (ensuredGeneration === generation) return
    ensuredGeneration = generation
    try {
      await request(
        'Execute',
        {
          task: [
            {
              'v1.common.setDatabaseSettings': [
                { isGraphicEnabled: true, isCCGraphicEnabled: true, isSketchGraphicEnabled: true, doCurveTessellation: true },
              ],
            },
          ],
          options: { undoable: false },
        },
        { track: false },
      )
    } catch {
      /* older servers — proceed without edges */
    }
  }

  async function getGraphic(o?: { recalc?: boolean }): Promise<Graphic | null> {
    await ensureGraphics()
    // recalc is OPT-IN: it regenerates the whole model and DESTROYS
    // entity-injection bodies. The pull alone reflects the current model.
    if (o?.recalc === true) {
      const result = await execute({ 'v1.common.recalc': [{}] })
      if ((result.maxLevel ?? 0) >= 51) throw new Error('Model regeneration failed: ' + JSON.stringify(result.messages))
    }

    if (!graphicCurrent()) await pull()
    return lastGraphic
  }

  async function refreshTree(): Promise<Structure | null> {
    try {
      await pull()
    } catch {
      /* non-fatal — caller sees lastStructure unchanged */
    }
    return lastStructure
  }

  // After (re)connecting, populate the caches and make sure a current
  // instance is set. Without this:
  //   1. tree/find return null/empty until the first pull.
  //   2. snapshot renders only the BaseWCSys axes because the renderer's
  //      pull has no current product to walk.
  // Both effects bite hardest when use_session attaches to a session another
  // client (Buerligons, etc.) already has a model loaded in.
  async function bootstrapSession(): Promise<void> {
    try {
      await pull()
    } catch {
      return
    }
    const s = lastStructure
    if (!s) return
    const cur = Number(s.currentInstance ?? 0)
    if (cur) return
    let rootId: Id | null = null
    for (const node of Object.values(s.tree ?? {})) {
      if (node && (node as { class?: string }).class === 'CC_AssemblyRoot') {
        rootId = (node as { id: Id }).id
        break
      }
    }
    if (rootId == null) return
    try {
      await request('Execute', {
        task: [{ 'v1.assembly.setCurrentInstance': [{ id: rootId }] }],
        options: { undoable: false },
      })
      await pull()
    } catch {
      /* non-fatal */
    }
  }

  // Open (or replace) the underlying WebSocket. Used both for the initial
  // connect() call and for reconnect(sessionId). Resets cached structure /
  // graphic state and rejects any in-flight requests on the old socket.
  function resetCaches(): void {
    outcomeUnknown = false
    for (const [, entry] of pending) {
      try {
        entry.reject(new Error('WebSocket reconnecting'))
      } catch {}
    }
    pending.clear()
    lastGraphic = null
    lastStructure = null
    treeVersion = -1
    graphicVersion = -1
    knownKernel = null
  }

  async function openBridge(token: string): Promise<void> {
    const registry = opts.bridge?.() ?? null
    if (!registry) throw new Error('The bridge listener is not running in this MCP (CLASSCAD_BRIDGE_LISTEN failed to bind, or the MCP runs in-process without a daemon).')
    if (ws && ws.readyState <= WebSocket.OPEN) {
      try {
        ws.close()
      } catch {}
      ws = undefined
    }
    detachBridge()
    resetCaches()
    transport = 'bridge'
    bridgeToken = token
    // Apps reconnect with backoff (buerli connectBridge: 500 ms … 5 s) after a
    // daemon restart; wait longer than the largest backoff step.
    const conn = await registry.waitFor(token, 8_000)
    if (!conn) {
      transport = 'ws'
      bridgeToken = null
      throw new Error(
        `No app has announced share token "${token}" on ${registry.url}. ` +
          'Create the share in the app first (it connects to this MCP when the token is minted), then call use_session again.',
      )
    }
    if (conn.kind !== 'bridge') {
      transport = 'ws'
      bridgeToken = null
      throw new Error(`Token "${token}" belongs to a server session (invite), not an in-app engine — pass it as ?invite= instead.`)
    }
    bridgeConn = conn
    bridgePeerId = randomUUID()
    bridgeUnsubClose = conn.onClose(() => {
      if (bridgeConn !== conn) return
      bridgeConn = null
      for (const [, entry] of pending) {
        try {
          entry.reject(new Error('bridge closed — the app revoked the share or went away'))
        } catch {}
      }
      pending.clear()
    })
    try {
      await conn.request('session.attached', { peerId: bridgePeerId, role: 'edit', client: 'classcad-mcp' })
    } catch {
      /* older apps without the session.* handlers still relay engine commands */
    }
    await bootstrapSession()
  }

  async function openWs(sessionId: string | null): Promise<void> {
    if (transport === 'bridge') detachBridge()
    // Leaving the local engine for a worker: the engine stays warm in case
    // the policy brings us back; close() ends it with the client.
    transport = 'ws'
    if (ws && ws.readyState <= WebSocket.OPEN) {
      try {
        ws.close()
      } catch {}
    }
    for (const [, entry] of pending) {
      try {
        entry.reject(new Error('WebSocket reconnecting'))
      } catch {}
    }
    pending.clear()
    lastGraphic = null
    lastStructure = null
    treeVersion = -1
    graphicVersion = -1
    knownKernel = null

    const wsOpts: WebSocket.ClientOptions = sessionId ? { headers: { 'ClassCAD-Session-Id': sessionId } } : {}
    const sock = new WebSocket(currentUrl, wsOpts)
    ws = sock

    sock.on('error', (err) => log(`ClassCAD WebSocket error: ${err.message}`))

    // Failures HERE mean "no worker there" (refused, unreachable, timeout) —
    // marked so the policy can fall back; failures after the open are not.
    await new Promise<void>((resolve, reject) => {
      let timer: ReturnType<typeof setTimeout> | undefined
      const cleanup = () => {
        if (timer) clearTimeout(timer)
        sock.off('open', opened)
        sock.off('error', fail)
      }
      const opened = () => {
        cleanup()
        resolve()
      }
      const fail = (err: Error) => {
        cleanup()
        ;(err as Error & { connectFailure?: boolean }).connectFailure = true
        try {
          sock.close()
        } catch {}
        reject(err)
      }
      sock.once('open', opened)
      sock.once('error', fail)
      if (!debug) timer = setTimeout(() => fail(new Error('Connection timeout')), opts.connectTimeoutMs ?? CONNECT_TIMEOUT)
    })
    sock.on('message', (d, b) => handleFrame(d, b))
  sock.on('close', () => {
    if (ws !== sock) return
    for (const entry of pending.values()) entry.reject(new Error('Worker disconnected; in-flight mutation outcome unknown'))
    pending.clear()
  })


    // No emission config is set here on purpose (see the header): the
    // connection keeps the engine's defaults so a shared session's app sees
    // everything this client emits. run_script suppresses per script.
    await bootstrapSession()
  }

  /**
   * use_session without a URL: a named worker session, or "whatever the
   * policy says" (engine argument; undefined keeps the client's policy).
   */
  async function reconnect(sessionId: string | null, engine?: EnginePolicy): Promise<void> {
    generation++
    inviteToken = null
    // Always perform an open so the caller gets back a connected, usable
    // socket. Cancels any in-flight ensureOpen() so it doesn't race with us.
    connectPromise = null
    currentUrl = baseUrl
    currentSessionId = sessionId
    if (engine) policy = engine
    await openByPolicy(sessionId ? 'drogon' : policy, sessionId)
  }

  async function reconnectUrl(newUrl: string): Promise<void> {
    generation++
    // Token/invite URLs address the session themselves — no session header.
    connectPromise = null
    currentUrl = newUrl
    currentSessionId = null
    try {
      inviteToken = new URL(newUrl).searchParams.get('invite')
    } catch {
      inviteToken = null
    }
    await openWs(null)
  }

  async function reconnectBridge(token: string): Promise<void> {
    generation++
    connectPromise = null
    currentSessionId = null
    inviteToken = null
    await openBridge(token)
  }

  // No eager open here. The WS is opened on first request/execute/pull call
  // (via ensureOpen) or immediately by reconnect(). This keeps the MCP
  // passive at startup so it doesn't create stray ephemeral worker sessions.

  return {
    request,
    execute,
    close,
    getStructure,
    getLastGraphic,
    getTree,
    getGraphic,
    pull,
    getEmissionConfig,
    setEmissionConfig,
    refreshTree,
    reconnect,
    reconnectUrl,
    reconnectBridge,
    get ws() {
      return ws
    },
    get transport() {
      return transport
    },
    get engine() {
      return policy
    },
    get wasmAvailable() {
      return wasmAvailable()
    },
    get localEngine() {
      return localEngine
    },
    get shareToken() {
      return bridgeToken ?? inviteToken
    },
    get connected() {
      if (transport === 'bridge') return bridgeConn !== null
      if (transport === 'wasm') return localEngine !== null
      return !!ws && ws.readyState === WebSocket.OPEN
    },
    get sessionId() {
      return currentSessionId
    },
    get url() {
      return currentUrl
    },
    get baseUrl() {
      return baseUrl
    },
    get generation() {
      return generation
    },
    get version() {
      return version
    },
  }
}
