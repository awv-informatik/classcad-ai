// bridge/server.ts — WebSocket listener for CC apps to opt into.
//
// Apps connect outbound to ws://localhost:9095/bridge (default) and send an
// `announce` message with their sessionId. The MCP keeps a registry of these
// connections, keyed by sessionId. The bridge tools route requests to the
// right connection based on the cc MCP's currently-attached session.

import { WebSocketServer, WebSocket } from 'ws'
import type {
  AnnounceMessage,
  BridgeEnvelope,
  BridgeMethod,
  EventMessage,
  RequestMessage,
  ResponseMessage,
  SelectionEntity,
} from './protocol.js'
import { PROTOCOL_VERSION } from './protocol.js'

const REQUEST_TIMEOUT = 60_000  // app-side picks can be long

type Pending = {
  resolve: (result: unknown) => void
  reject: (err: Error) => void
  timer?: NodeJS.Timeout
}

export type AppConnection = {
  clientId: string
  sessionId: string
  drawingId: string
  app: string
  appVersion?: string
  capabilities: string[]
  protocolVersion: number
  announcedAt: number
  request: <T = unknown>(method: BridgeMethod, params?: unknown) => Promise<T>
  // Cached state populated by event:selection.changed.
  cachedSelection: SelectionEntity[] | null
  // Underlying socket; close to disconnect.
  socket: WebSocket
}

export type BridgeRegistry = {
  // List all connections, optionally filtered by sessionId.
  list: (sessionId?: string) => AppConnection[]
  // Get a single connection for a session. If multiple are registered,
  // returns the most recently announced one. Returns null if none.
  pick: (sessionId: string, clientId?: string) => AppConnection | null
  // Subscribe to selection events for a session — the cb fires on every
  // selection.changed event. Returns an unsubscribe function.
  onSelectionChanged: (sessionId: string, cb: (items: SelectionEntity[]) => void) => () => void
  // Stop listening, close all sockets.
  close: () => Promise<void>
  readonly url: string
}

export type StartBridgeOptions = {
  // Where to listen. Default ws://localhost:9095/bridge.
  // The path is fixed at /bridge; only host:port is configurable.
  listen?: string
}

export async function startBridgeServer(opts: StartBridgeOptions = {}): Promise<BridgeRegistry> {
  const listen = opts.listen ?? 'ws://localhost:9096/bridge'
  const url = new URL(listen)
  const host = url.hostname || 'localhost'
  const port = Number(url.port || '9096')
  const path = url.pathname || '/bridge'

  const wss = new WebSocketServer({ host, port, path })
  const connections = new Map<string, AppConnection>() // clientId → conn
  const selectionListeners = new Map<string, Set<(items: SelectionEntity[]) => void>>()

  wss.on('connection', (socket) => {
    let conn: AppConnection | null = null
    const pending = new Map<number, Pending>()

    const sendRaw = (env: BridgeEnvelope) => {
      try {
        socket.send(JSON.stringify(env))
      } catch (err) {
        // socket may already be closing; safe to ignore
      }
    }

    let nextId = 1
    const request = <T,>(method: BridgeMethod, params?: unknown): Promise<T> => {
      const id = nextId++
      return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => {
          if (pending.has(id)) {
            pending.delete(id)
            reject(new Error(`bridge request timeout (${REQUEST_TIMEOUT}ms): ${method}`))
          }
        }, REQUEST_TIMEOUT)
        pending.set(id, { resolve: resolve as (r: unknown) => void, reject, timer })
        sendRaw({ type: 'request', id, method, params })
      })
    }

    socket.on('message', (data) => {
      let env: BridgeEnvelope
      try {
        env = JSON.parse(data.toString()) as BridgeEnvelope
      } catch {
        return
      }
      if (env.type === 'announce') {
        const a = env as AnnounceMessage
        if (conn) return // ignore re-announce on the same socket
        conn = {
          clientId: a.clientId,
          sessionId: a.sessionId,
          drawingId: a.drawingId,
          app: a.app,
          appVersion: a.appVersion,
          capabilities: a.capabilities,
          protocolVersion: a.protocolVersion,
          announcedAt: Date.now(),
          request,
          cachedSelection: null,
          socket,
        }
        connections.set(a.clientId, conn)
        return
      }
      if (env.type === 'response') {
        const r = env as ResponseMessage
        const p = pending.get(r.id)
        if (!p) return
        pending.delete(r.id)
        if (p.timer) clearTimeout(p.timer)
        if (r.error) {
          p.reject(new Error(`${r.error.code}: ${r.error.message}`))
        } else {
          p.resolve(r.result)
        }
        return
      }
      if (env.type === 'event' && conn) {
        const e = env as EventMessage
        if (e.channel === 'selection.changed') {
          const payload = (e.payload ?? {}) as { items?: SelectionEntity[] }
          const items = payload.items ?? []
          conn.cachedSelection = items
          const subs = selectionListeners.get(conn.sessionId)
          if (subs) for (const cb of subs) try { cb(items) } catch {}
        }
        return
      }
    })

    socket.on('close', () => {
      // reject any in-flight requests
      for (const [, p] of pending) {
        try { p.reject(new Error('bridge socket closed')) } catch {}
        if (p.timer) clearTimeout(p.timer)
      }
      pending.clear()
      if (conn) connections.delete(conn.clientId)
    })

    socket.on('error', () => { /* close handler will fire */ })
  })

  // wait for listening, but don't block other startup if the port is busy —
  // surface the error to the caller.
  await new Promise<void>((resolve, reject) => {
    wss.once('listening', () => resolve())
    wss.once('error', (err) => reject(err))
  })

  return {
    url: `ws://${host}:${port}${path}`,
    list: (sessionId?: string) => {
      const all = [...connections.values()]
      return sessionId ? all.filter(c => c.sessionId === sessionId) : all
    },
    pick: (sessionId: string, clientId?: string) => {
      if (clientId) return connections.get(clientId) ?? null
      const matches = [...connections.values()].filter(c => c.sessionId === sessionId)
      if (matches.length === 0) return null
      // most recently announced wins
      matches.sort((a, b) => b.announcedAt - a.announcedAt)
      return matches[0]
    },
    onSelectionChanged: (sessionId: string, cb: (items: SelectionEntity[]) => void) => {
      let set = selectionListeners.get(sessionId)
      if (!set) {
        set = new Set()
        selectionListeners.set(sessionId, set)
      }
      set.add(cb)
      return () => {
        const s = selectionListeners.get(sessionId)
        if (!s) return
        s.delete(cb)
        if (s.size === 0) selectionListeners.delete(sessionId)
      }
    },
    close: async () => {
      for (const [, conn] of connections) {
        try { conn.socket.close() } catch {}
      }
      connections.clear()
      await new Promise<void>((resolve) => wss.close(() => resolve()))
    },
  }
}

// re-export PROTOCOL_VERSION for callers that want to log compat info
export { PROTOCOL_VERSION }
