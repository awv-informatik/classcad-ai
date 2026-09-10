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

import WebSocket from 'ws'
import { randomUUID } from 'crypto'
import type { ApiResult, Graphic, Message, Structure } from './types.js'

const DEFAULT_URL = 'ws://0.0.0.0:9094/'
const REQUEST_TIMEOUT = 30_000
const CONNECT_TIMEOUT = 5_000

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
  debug?: boolean // default false — disables all timeouts
  sessionId?: string | null // optional — initial session id to send as ClassCAD-Session-Id header
}

export type Client = {
  /** Raw request. Tracked as a potential mutation unless `opts.track === false`. */
  request: <T = unknown>(command: string, extra?: object, opts?: { track?: boolean }) => Promise<ApiResult<T>>
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
  reconnect: (sessionId: string | null) => Promise<void>
  /** Reconnect to a DIFFERENT server URL — e.g. a multi-client token/invite URL (`wss://…/?invite=…`), used verbatim. */
  reconnectUrl: (url: string) => Promise<void>
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
  const pending = new Map<string, PendingEntry>()
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

  function send(obj: object): void {
    if (!ws) throw new Error('WebSocket not open')
    ws.send(JSON.stringify(obj))
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

    let result = frame.result
    if (result && typeof result === 'object' && 'result' in result && Object.keys(result).length <= 3) {
      result = (result as any).result
    }
    const messages: Message[] = (frame.messages || []).filter((m: Message) => m.level > 31)

    // A pull (GetTree/Sync) delivers the COMPLETE graphic — replace, never
    // merge (a merge would keep containers of deleted bodies alive). Graphic
    // on other Results covers only the changed ids and is ignored here.
    const isPull = frame._from_ === 'GetTree' || frame._from_ === 'Sync'
    if (isPull && frame.graphic && (frame.graphic.containers?.length > 0 || frame.graphic.properties)) {
      lastGraphic = frame.graphic as Graphic
      graphicVersion = Math.max(graphicVersion, entry.at)
    }
    // Every structure snapshot is complete (the engine sends the whole tree).
    if (frame.structure && typeof frame.structure === 'object' && !Array.isArray(frame.structure)) {
      lastStructure = frame.structure as Structure
      treeVersion = Math.max(treeVersion, entry.at)
    }

    entry.resolve({
      result,
      messages,
      maxLevel: frame.maxLevel ?? 0,
      structure: frame.structure ?? null,
      graphic: frame.graphic ?? null,
    })
  }

  async function request<T = unknown>(command: string, extra: object = {}, o: { track?: boolean } = {}): Promise<ApiResult<T>> {
    await ensureOpen()
    if (o.track !== false) version++
    const transactionID = randomUUID()
    return new Promise((resolve, reject) => {
      pending.set(transactionID, { resolve: resolve as (r: ApiResult) => void, reject, at: version })
      // No emission flags travel with a request — the engine keeps them per
      // connection (see SUPPRESS_EMISSION / setEmissionConfig in openWs).
      send({ command, commandVersion: 'v1', transactionID, ...extra })
      if (!debug) {
        setTimeout(() => {
          if (pending.has(transactionID)) {
            pending.delete(transactionID)
            reject(new Error(`Timeout (${REQUEST_TIMEOUT}ms): ${command}`))
          }
        }, REQUEST_TIMEOUT)
      }
    })
  }

  // Open the WS lazily on first use. Single-flight: concurrent callers share
  // the in-flight open. After a successful open, ws stays defined; close()
  // and reconnect() reset it as needed.
  async function ensureOpen(): Promise<void> {
    if (ws && ws.readyState === WebSocket.OPEN) return
    if (connectPromise) return connectPromise
    connectPromise = openWs(currentSessionId).finally(() => {
      connectPromise = null
    })
    return connectPromise
  }

  function execute<T = unknown>(task: object): Promise<ApiResult<T>> {
    return request<T>('Execute', { task: [task], options: { undoable: false } })
  }

  function close(): void {
    if (ws && ws.readyState <= WebSocket.OPEN) ws.close()
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
    if (toggle) await setEmissionConfig(PULL_GRAPHIC_ON)
    try {
      await request('GetTree', {}, { track: false })
      // A pull is the only source of the complete graphic: whatever it
      // delivered (possibly nothing, e.g. graphics:false) is current now.
      graphicVersion = Math.max(graphicVersion, at)
    } finally {
      if (toggle) await setEmissionConfig({ sendGraphic_Kernel: false })
    }
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
      try {
        await execute({ 'v1.common.recalc': [{}] })
      } catch {
        /* pull below still serves the current state */
      }
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
  async function openWs(sessionId: string | null): Promise<void> {
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

    await new Promise<void>((resolve, reject) => {
      sock.on('open', () => resolve())
      sock.on('error', (err) => reject(err))
      if (!debug) setTimeout(() => reject(new Error('Connection timeout')), CONNECT_TIMEOUT)
    })
    sock.on('message', (d, b) => handleFrame(d, b))

    // No emission config is set here on purpose (see the header): the
    // connection keeps the engine's defaults so a shared session's app sees
    // everything this client emits. run_script suppresses per script.
    await bootstrapSession()
  }

  async function reconnect(sessionId: string | null): Promise<void> {
    generation++
    // Always perform an open so the caller gets back a connected, usable
    // socket. Cancels any in-flight ensureOpen() so it doesn't race with us.
    connectPromise = null
    currentUrl = baseUrl
    currentSessionId = sessionId
    await openWs(sessionId)
  }

  async function reconnectUrl(newUrl: string): Promise<void> {
    generation++
    // Token/invite URLs address the session themselves — no session header.
    connectPromise = null
    currentUrl = newUrl
    currentSessionId = null
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
    get ws() {
      return ws
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
