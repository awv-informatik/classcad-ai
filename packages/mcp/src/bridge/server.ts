// bridge/server.ts — WebSocket listener for CC apps to opt into.
//
// Apps connect outbound to ws://localhost:9096/bridge (default) and send an
// `announce` with a share token. The MCP keeps a registry of these
// connections keyed by clientId and indexed by token. Two uses:
//   • kind 'invite'  — app-state bridge (selection) next to a server session
//     the MCP joined with the same token.
//   • kind 'bridge'  — the engine transport itself for in-app (WASM) engines:
//     client.ts relays every engine command through `engine.execute`.

import { WebSocketServer, WebSocket } from 'ws'
import type {
  AnnounceMessage,
  BridgeEnvelope,
  BridgeMethod,
  EventMessage,
  RequestMessage,
  ResponseMessage,
  SelectionEntity,
  ShareKind,
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
  /** The share token this connection serves. */
  token: string
  kind: ShareKind
  /** @deprecated alias of `token` (pre-token announces). */
  sessionId: string
  drawingId: string
  app: string
  appVersion?: string
  capabilities: string[]
  protocolVersion: number
  announcedAt: number
  request: <T = unknown>(method: BridgeMethod, params?: unknown) => Promise<T>
  // Register a callback for when this app connection goes away; returns the unsubscribe.
  onClose: (cb: () => void) => () => void
  // Cached state populated by event:selection.changed.
  cachedSelection: SelectionEntity[] | null
  // Underlying socket; close to disconnect.
  socket: WebSocket
}

export type BridgeRegistry = {
  // List all connections, optionally filtered by token.
  list: (token?: string) => AppConnection[]
  // Get a single connection for a token. If multiple are registered,
  // returns the most recently announced one. Returns null if none.
  pick: (token: string, clientId?: string) => AppConnection | null
  // Like pick, but waits up to timeoutMs for an app to announce the token
  // (apps announce as soon as they mint a token; the user may paste the link first).
  waitFor: (token: string, timeoutMs?: number) => Promise<AppConnection | null>
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

  // Resolvers waiting for a token to be announced (waitFor).
  const waiters = new Map<string, Set<(c: AppConnection) => void>>()

  wss.on('connection', (socket) => {
    let conn: AppConnection | null = null
    const pending = new Map<number, Pending>()
    const closeListeners = new Set<() => void>()

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
        // Token: current apps send `token` + `kind`; the modeler used to send
        // its Drogon invite as `invite`, older builds a `sessionId`.
        const token = a.token ?? a.invite ?? a.sessionId
        if (!token) return
        const kind: ShareKind = a.kind ?? 'invite'
        conn = {
          clientId: a.clientId,
          token,
          kind,
          sessionId: token,
          drawingId: a.drawingId,
          app: a.app,
          appVersion: a.appVersion,
          capabilities: a.capabilities,
          protocolVersion: a.protocolVersion,
          announcedAt: Date.now(),
          request,
          onClose: (cb: () => void) => {
            closeListeners.add(cb)
            return () => {
              closeListeners.delete(cb)
            }
          },
          cachedSelection: null,
          socket,
        }
        connections.set(a.clientId, conn)
        const waiting = waiters.get(token)
        if (waiting) {
          waiters.delete(token)
          for (const resolve of waiting) resolve(conn)
        }
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
      for (const cb of closeListeners) try { cb() } catch {}
      closeListeners.clear()
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
    list: (token?: string) => {
      const all = [...connections.values()]
      return token ? all.filter(c => c.token === token) : all
    },
    pick: (token: string, clientId?: string) => {
      if (clientId) return connections.get(clientId) ?? null
      const matches = [...connections.values()].filter(c => c.token === token)
      if (matches.length === 0) return null
      // most recently announced wins
      matches.sort((a, b) => b.announcedAt - a.announcedAt)
      return matches[0]
    },
    waitFor: (token: string, timeoutMs = 5_000) => {
      const now = [...connections.values()].filter(c => c.token === token).sort((a, b) => b.announcedAt - a.announcedAt)[0]
      if (now) return Promise.resolve(now)
      return new Promise<AppConnection | null>(resolve => {
        let set = waiters.get(token)
        if (!set) {
          set = new Set()
          waiters.set(token, set)
        }
        const target = set
        const cb = (c: AppConnection) => {
          clearTimeout(timer)
          resolve(c)
        }
        const timer = setTimeout(() => {
          target.delete(cb)
          if (target.size === 0) waiters.delete(token)
          resolve(null)
        }, timeoutMs)
        target.add(cb)
      })
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
