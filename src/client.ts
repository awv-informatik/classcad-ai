// client.ts — ClassCAD WebSocket client (TS port of scripts/client.mjs).
//
// Connects to a Drogon WS server, sends the mandatory Configuration command,
// and exposes promise-based execute()/request() helpers. Caches the latest
// graphic payload and structure tree so MCP tools can read state without an
// extra round-trip.
//
// Supports reconnecting with a different ClassCAD-Session-Id header at runtime
// via reconnect(sessionId) — used by the use_session MCP tool.

import WebSocket from 'ws'
import { randomUUID } from 'crypto'
import type { ApiResult, Graphic, GraphicContainer, Message, Structure } from './types.js'

const DEFAULT_URL = 'ws://0.0.0.0:9094/'
const REQUEST_TIMEOUT = 30_000
const CONNECT_TIMEOUT = 5_000

type PendingEntry = {
  resolve: (r: ApiResult) => void
  reject: (e: Error) => void
}

type Id = number | string

export type ConnectOptions = {
  graphics?: boolean // default true — enables server-side graphic push
  debug?: boolean // default false — disables all timeouts
  sessionId?: string | null // optional — initial session id to send as ClassCAD-Session-Id header
}

export type Client = {
  request: <T = unknown>(command: string, extra?: object) => Promise<ApiResult<T>>
  execute: <T = unknown>(task: object) => Promise<ApiResult<T>>
  close: () => void
  getStructure: () => Structure | null
  getLastGraphic: () => Graphic | null
  refreshTree: () => Promise<Structure | null>
  reconnect: (sessionId: string | null) => Promise<void>
  readonly ws: WebSocket | undefined
  readonly sessionId: string | null
  readonly url: string
}

export async function connect(url: string = DEFAULT_URL, opts: ConnectOptions = {}): Promise<Client> {
  const graphics = opts.graphics !== false
  const debug = opts.debug === true
  const pending = new Map<string, PendingEntry>()

  let lastGraphic: Graphic | null = null
  let lastStructure: Structure | null = null
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

    if (frame.graphic && (frame.graphic.containers?.length > 0 || frame.graphic.properties)) {
      if (!lastGraphic) {
        lastGraphic = frame.graphic as Graphic
      } else {
        const incoming: GraphicContainer[] = frame.graphic.containers || []
        const existing: GraphicContainer[] = lastGraphic.containers || []
        const curveById = new Map<Id, GraphicContainer>()
        for (const c of existing) if (c.type === 2) curveById.set(c.id, c)
        for (const c of incoming) if (c.type === 2) curveById.set(c.id, c)
        const nonCurve = incoming.filter((c) => c.type !== 2)
        const oldNonCurve = nonCurve.length > 0 ? [] : existing.filter((c) => c.type !== 2)
        lastGraphic = {
          ...frame.graphic,
          containers: [...oldNonCurve, ...nonCurve, ...curveById.values()],
        } as Graphic
      }
    }

    if (frame.structure && typeof frame.structure === 'object' && !Array.isArray(frame.structure)) {
      lastStructure = frame.structure as Structure
    }

    entry.resolve({
      result,
      messages,
      maxLevel: frame.maxLevel ?? 0,
      structure: frame.structure ?? null,
      graphic: frame.graphic ?? null,
    })
  }

  async function request<T = unknown>(command: string, extra: object = {}): Promise<ApiResult<T>> {
    await ensureOpen()
    const transactionID = randomUUID()
    return new Promise((resolve, reject) => {
      pending.set(transactionID, { resolve: resolve as (r: ApiResult) => void, reject })
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

  async function refreshTree(): Promise<Structure | null> {
    // Use the worker's GetTree command directly. The previous implementation
    // issued a no-op v1.common.getAppVersion on the assumption that
    // "structure rides every Result frame" (per state-tree.md). In practice,
    // after attaching to a session whose currentProduct is unset, the worker
    // omits frame.structure from the getAppVersion result, so lastStructure
    // stayed null forever. GetTree always returns the structure.
    try {
      await request('GetTree')
    } catch {
      /* non-fatal — caller sees lastStructure unchanged */
    }
    return lastStructure
  }

  // After (re)connecting and configuring, populate lastStructure and make
  // sure a current instance is set. Without this:
  //   1. tree/find return null/empty until some unrelated API call happens
  //      to provoke the worker into sending a structure frame.
  //   2. snapshot renders only the BaseWCSys axes because the renderer's
  //      recalc has no current product to walk.
  // Both effects bite hardest when use_session attaches to a session another
  // client (Buerligons, etc.) already has a model loaded in.
  async function bootstrapSession(): Promise<void> {
    try {
      await request('GetTree')
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
      await request('GetTree')
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

    const wsOpts: WebSocket.ClientOptions = sessionId ? { headers: { 'ClassCAD-Session-Id': sessionId } } : {}
    const sock = new WebSocket(url, wsOpts)
    ws = sock

    await new Promise<void>((resolve, reject) => {
      sock.on('open', () => resolve())
      sock.on('error', (err) => reject(err))
      if (!debug) setTimeout(() => reject(new Error('Connection timeout')), CONNECT_TIMEOUT)
    })
    sock.on('message', (d, b) => handleFrame(d, b))

    send({
      command: 'Configuration',
      commandVersion: 'v1',
      config: {
        sendStructure: true,
        sendStructure_Patch: true,
        sendStructure_Immediately: false,
        sendGraphic_Kernel: graphics,
        sendGraphic_StructureObj: graphics,
        sendGraphic_Sketch: graphics,
        sendGraphic_Compressed: false,
        sendGraphic_Immediately: false,
        sendGraphic_ImmediatelyBinary: false,
        sendGraphic_Multipackage: false,
        sendMessages: true,
        sendMessages_Immediately: false,
      },
    })
    await new Promise((r) => setTimeout(r, 300))

    await bootstrapSession()
  }

  async function reconnect(sessionId: string | null): Promise<void> {
    // Always perform an open so the caller gets back a connected, usable
    // socket. Cancels any in-flight ensureOpen() so it doesn't race with us.
    connectPromise = null
    currentSessionId = sessionId
    await openWs(sessionId)
  }

  // No eager open here. The WS is opened on first request/execute/refreshTree
  // call (via ensureOpen) or immediately by reconnect(). This keeps the MCP
  // passive at startup so it doesn't create stray ephemeral worker sessions.

  return {
    request,
    execute,
    close,
    getStructure,
    getLastGraphic,
    refreshTree,
    reconnect,
    get ws() {
      return ws
    },
    get sessionId() {
      return currentSessionId
    },
    url,
  }
}
