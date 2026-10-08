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
// ── Two engines, one client ──────────────────────────────────────────────────
//   ws     a ClassCAD worker (Drogon) over WebSocket - own session or a shared
//          one (?invite=). The default.
//   wasm   the MCP's OWN engine: the published WASM build hosted in a worker
//          thread of this process (engine/wasm.ts). Needs a key.
// Which one is used: an invite URL decides by itself (→ ws). Without one the
// ENGINE POLICY applies (opts.engine / use_session's engine argument): 'auto'
// tries the worker first and falls back to the local WASM when the worker is
// not reachable; 'drogon' insists on the worker; 'wasm' goes local right away.
//
// ── Sharing ──────────────────────────────────────────────────────────────────
// Either engine can be shared with apps, by the session protocol of a ClassCAD
// server (invites, peers, presence, fan-out of every command's frames). On a
// worker the server speaks it; for the MCP's own engine share/hub.ts does,
// through relay() and onEngineReply() below. What reaches this client of that
// protocol besides its own results (peers, presence) goes to onSessionFrame().

import WebSocket from 'ws'
import { randomUUID } from 'crypto'
import { connect as tcpConnect } from 'net'
import type { ApiResult, Graphic, Message, Structure } from './types.js'
import { startLocalEngine, type EngineExecuteResult, type LocalEngine, type LocalWasmOptions } from './engine/wasm.js'

export type EnginePolicy = 'auto' | 'drogon' | 'wasm'
/** How a client reaches its engine: 'ws' a ClassCAD worker over WebSocket, 'wasm' the MCP's own engine. */
export type Transport = 'ws' | 'wasm'

/** Frames of the session protocol that answer no request (see SessionFrame). */
const SESSION_FRAMES = new Set(['SessionJoined', 'PeerJoined', 'PeerLeft', 'Presence'])
/** Commands that change nothing: a sibling's Result for one of them leaves the caches valid. */
const READS = new Set(['GetTree', 'Sync', 'GetEmissionConfig', 'SetEmissionConfig', 'CreateInvite', 'RevokeInvite'])

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
  /** Which engine to use when no token/URL decides it. Default 'auto'. */
  engine?: EnginePolicy
  /** Settings of the local WASM engine; null/undefined = no key = not available. */
  wasm?: LocalWasmOptions | null
  /** Where connection decisions are reported (stderr / daemon log). */
  log?: (msg: string) => void
}

/** Hears one reply of the MCP's own engine: the request, what the engine emitted for it, and who asked. */
export type EngineReplyListener = (req: Record<string, unknown>, res: EngineExecuteResult, origin: 'host' | 'guest') => void

/**
 * A frame of the session protocol that is not the answer to a request of this
 * client: SessionJoined, PeerJoined, PeerLeft, Presence. One more is made up
 * here: `Connected` (with `transport`), whenever the engine link was opened —
 * whoever was known of the session before is not in this one.
 */
export type SessionFrame = { command: string; [key: string]: any }

/**
 * The graphic database settings the MCP's renders are built on (brep edges,
 * sketch and structure-object graphics, tessellated curves). The database is
 * the engine's, shared by everyone on it: a docked app's own settings must not
 * switch these off (share/hub.ts keeps them on).
 */
export const GRAPHIC_SETTINGS = { isGraphicEnabled: true, isCCGraphicEnabled: true, isSketchGraphicEnabled: true, doCurveTessellation: true }

export type Client = {
  /** Raw request. Tracked as a potential mutation unless `opts.track === false`. */
  request: <T = unknown>(command: string, extra?: object, opts?: { track?: boolean }) => Promise<ApiResult<T>>
  /** One API task. */
  execute: <T = unknown>(task: object) => Promise<ApiResult<T>>
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
  /** Opens the engine link now (it opens by itself on the first request otherwise). */
  open: () => Promise<void>
  /**
   * A docked app's command, run on the MCP's own engine (transport 'wasm'):
   * the raw request in, everything the engine emitted out. The caches follow
   * (the app may have changed the model). See share/hub.ts.
   */
  relay: (req: Record<string, unknown>) => Promise<EngineExecuteResult>
  /**
   * Hears every reply of the MCP's own engine, whoever asked: `host` is this
   * client, `guest` a docked app (relay). Returns the unsubscribe function.
   */
  onEngineReply: (listener: EngineReplyListener) => () => void
  /** Hears when the MCP's own engine was started or replaced (crash, timeout): its drawing is empty. */
  onEngineStart: (listener: () => void) => () => void
  /** The complete graphic of the MCP's own engine: every container emitted so far that is still in the model. */
  engineContainers: () => unknown[]
  /** The undo history of the MCP's own engine as it is now (its last UndoStack message); undefined while it reported none, as an engine without undo never does. */
  engineUndoStack?: () => Record<string, any> | undefined
  /** Hears the session frames a ClassCAD server sends this connection (peers, presence). Returns the unsubscribe function. */
  onSessionFrame: (listener: (frame: SessionFrame) => void) => () => void
  /** Sends a frame that expects no answer to the ClassCAD server (presence). False when there is no open worker connection. */
  sendFrame: (frame: SessionFrame) => boolean
  /** 'ws' (a ClassCAD worker over WebSocket) or 'wasm' (the MCP's own engine). */
  readonly transport: Transport
  /** The engine policy in force when no token/URL decides ('auto' | 'drogon' | 'wasm'). */
  readonly engine: EnginePolicy
  /** True when a key for the local WASM engine is configured. */
  readonly wasmAvailable: boolean
  /** The running local engine, if any. */
  readonly localEngine: LocalEngine | null
  /** The invite token this client joined a server session with, or null (its own session). */
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

  let transport: Transport = 'ws'
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
  const wasmAvailable = () => !!opts.wasm
  const log = opts.log ?? (() => {})
  // The invite token of a server session joined via reconnectUrl (?invite=…).
  let inviteToken: string | null = null
  // The local engine emits graphic as binary packages per command (no bundled
  // graphic on GetTree). Accumulate containers by id so a pull can hand the
  // renderer the complete picture; the renderer drops consumed bodies itself.
  const containers = new Map<string, any>()
  // The local engine's undo history as it is now: its last UndoStack message,
  // for an app that docks later (share/hub.ts).
  let undoStack: Record<string, any> | undefined

  function send(obj: Record<string, unknown>): void {
    if (transport === 'wasm') {
      sendViaEngine(obj)
      return
    }
    if (!ws) throw new Error('WebSocket not open')
    ws.send(JSON.stringify(obj))
  }

  /** The local engine: one request → everything the engine emitted for it. */
  function sendViaEngine(req: Record<string, unknown>): void {
    const txId = String(req.transactionID)
    if (!localEngine) {
      const entry = pending.get(txId)
      pending.delete(txId)
      entry?.reject(new Error('local WASM engine is not running'))
      return
    }
    localEngine.execute(req).then(
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

  /**
   * Keeps the accumulated graphic in step with one reply of the local engine,
   * whoever asked. The engine never announces that a body is gone, so
   * containers are dropped here: all of them when the drawing is emptied
   * (clear, load with doClear — a restored checkpoint included), and on every
   * pull those whose owner left the model tree (a deleted feature, a clear
   * that kept some ids). Without this a render shows bodies of earlier models
   * next to the current one. The undo history is kept as the engine last
   * reported it (after an undoable command, an Undo or a Redo).
   */
  function absorb(req: Record<string, unknown>, res: EngineExecuteResult): void {
    if (res.decodeErrors?.length) log(`${String(req.command)}: dropped undecodable engine output (${res.decodeErrors.join('; ')})`)
    if (emptiesDrawing(req)) containers.clear()
    for (const pkg of res.binaryMessages ?? []) {
      for (const c of (pkg as any)?.containers ?? []) {
        if (c && c.id != null) containers.set(String(c.id), c)
      }
    }
    for (const m of res.messages ?? []) {
      if (m?.command === 'UndoStack') undoStack = m
      if (m?.command !== 'Result') continue
      const from = m._from_ ?? m.from ?? req.command
      if (from !== 'GetTree' && from !== 'Sync') continue
      const tree = (m.structure ?? m.result)?.tree
      if (!tree || typeof tree !== 'object') continue
      for (const [key, c] of containers) {
        if (!(String(c.owner ?? c.id) in tree)) containers.delete(key)
      }
    }
  }

  const replyListeners = new Set<EngineReplyListener>()
  function onEngineReply(listener: EngineReplyListener): () => void {
    replyListeners.add(listener)
    return () => void replyListeners.delete(listener)
  }

  /** A docked app's command on the MCP's own engine (see Client.relay). */
  async function relay(req: Record<string, unknown>): Promise<EngineExecuteResult> {
    await ensureOpen()
    if (transport !== 'wasm' || !localEngine) throw new Error('this session does not run on the MCP\'s own engine')
    const res = await localEngine.execute(req)
    // Anything but a pull may have changed the model: the caches are stale, and
    // database settings an app set may have replaced the ones renders need.
    if (req.command !== 'GetTree' && req.command !== 'Sync') {
      version++
      if (touchesDatabaseSettings(req)) ensuredGeneration = -1
    }
    absorb(req, res)
    for (const hear of replyListeners) hear(req, res, 'guest')
    return res
  }

  /** Whether a command sets the engine's database settings (the ones GRAPHIC_SETTINGS must then be put back into). */
  function touchesDatabaseSettings(req: Record<string, unknown>): boolean {
    return Array.isArray(req.task) && req.task.some(t => t && typeof t === 'object' && 'v1.common.setDatabaseSettings' in t)
  }

  const engineStartListeners = new Set<() => void>()
  function onEngineStart(listener: () => void): () => void {
    engineStartListeners.add(listener)
    return () => void engineStartListeners.delete(listener)
  }

  const sessionListeners = new Set<(frame: SessionFrame) => void>()
  function onSessionFrame(listener: (frame: SessionFrame) => void): () => void {
    sessionListeners.add(listener)
    return () => void sessionListeners.delete(listener)
  }
  function sendFrame(frame: SessionFrame): boolean {
    if (transport !== 'ws' || !ws || ws.readyState !== WebSocket.OPEN) return false
    ws.send(JSON.stringify(frame))
    return true
  }

  /** Turns a reply of the local engine into worker-shaped Result frames and delivers them. */
  function deliverEngineResult(req: Record<string, unknown>, res: EngineExecuteResult): void {
    const txId = String(req.transactionID)
    const fail = (why: string) => {
      const entry = pending.get(txId)
      if (entry) {
        pending.delete(txId)
        entry.reject(new Error(why))
      }
    }
    absorb(req, res)
    for (const hear of replyListeners) hear(req, res, 'host')
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
        // A pull delivers the COMPLETE graphic: the accumulated containers (absorb pruned them).
        frame.graphic = { containers: [...containers.values()] }
      }
      delivered = true
      handleFrame(Buffer.from(JSON.stringify(frame)), false)
    }
    if (!delivered) {
      const detail = [...sideErrors.map(e => e.message), ...(res.decodeErrors ?? [])]
      fail(`engine returned no Result for ${describeRequest(req)}${detail.length ? ` (${detail.join('; ')})` : ''}`)
    }
  }

  /** True for an Execute that leaves an empty drawing behind before anything new is emitted. */
  function emptiesDrawing(req: Record<string, unknown>): boolean {
    const task = Array.isArray(req.task) ? (req.task[0] as Record<string, unknown> | undefined) : undefined
    if (!task) return false
    const first = (name: string) => (Array.isArray(task[name]) ? (task[name] as any[])[0] : task[name]) as Record<string, unknown> | undefined
    if ('v1.common.clear' in task) return !(first('v1.common.clear')?.keepIds as unknown[] | undefined)?.length
    if ('v1.common.load' in task) return Boolean(first('v1.common.load')?.doClear)
    return false
  }

  function describeRequest(req: Record<string, unknown>): string {
    const task = Array.isArray(req.task) ? (req.task[0] as Record<string, unknown> | undefined) : undefined
    const method = task ? Object.keys(task)[0] : undefined
    return method ? `${String(req.command)} ${method}` : String(req.command)
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
    if (!txId) {
      // The session protocol's own frames: who joined or left, what they published.
      if (SESSION_FRAMES.has(frame?.command)) for (const hear of sessionListeners) hear(frame as SessionFrame)
      return
    }
    const entry = pending.get(txId)
    if (!entry) {
      // A sibling's command (the server fans its frames out to everyone in the
      // session): whatever it was, the model may be another one now.
      if (frame.command === 'Result' && !READS.has(frame._from_)) version++
      return
    }
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
      if (!wasmAvailable()) throw new Error('No local WASM engine (CLASSCAD_WASM=off): use engine "drogon" with a running ClassCAD worker.')
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
            'or unset CLASSCAD_WASM=off so the MCP can host the engine itself (local WASM).',
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
      // A new engine has an empty drawing, no undo history and default
      // database settings. Checkpoints (save payloads held here) stay valid:
      // restore loads them into this one.
      containers.clear()
      undoStack = undefined
      ensuredGeneration = -1
      await bootstrapSession()
      for (const hear of engineStartListeners) hear()
    }
    for (const hear of sessionListeners) hear({ command: 'Connected', transport: 'wasm' })
  }

  /** Replaces a retired local engine (crash, trap, timeout) with a new one. */
  async function restartLocalEngine(why: string): Promise<void> {
    log(`local WASM engine is gone (${why}) — starting a new one with an empty drawing`)
    localEngine?.close(why)
    localEngine = null
    await openWasm()
  }

  function execute<T = unknown>(task: object): Promise<ApiResult<T>> {
    return request<T>('Execute', { task: [task], options: { undoable: false } })
  }

  function close(): void {
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
            { 'v1.common.setDatabaseSettings': [{ ...GRAPHIC_SETTINGS }] },
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

  async function openWs(sessionId: string | null): Promise<void> {
    // Leaving the local engine for a worker: the engine stays warm in case
    // the policy brings us back; close() ends it with the client.
    transport = 'ws'
    containers.clear()
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
    for (const hear of sessionListeners) hear({ command: 'Connected', transport: 'ws' })
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
    open: ensureOpen,
    relay,
    onEngineReply,
    onEngineStart,
    engineContainers: () => [...containers.values()],
    engineUndoStack: () => undoStack,
    onSessionFrame,
    sendFrame,
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
      return inviteToken
    },
    get connected() {
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
