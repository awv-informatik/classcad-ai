// index.ts — the ClassCAD share relay: where a session on somebody's machine is joined from anywhere.
//
// An MCP session runs on its user's machine, and the listener it is joined on
// binds 127.0.0.1 (share/server.ts in @classcad/mcp): nobody else reaches it.
// This Worker is the address the others use. It speaks the part of that
// listener's protocol that introduces a host and its guests — what a page that
// hosts its own session says to the listener, said here by the MCP:
//
//   wss://<relay>/session/?host=<invite>              the host, offering the invite: a standing connection, taken from a
//                                                     signed-in machine only (Authorization: Bearer <Firebase ID token>)
//   wss://<relay>/session/?invite=<invite>            a guest: the app, in a browser anywhere. The host is told
//                                                     ({ relay: 'guest', guest: <id> }) and has a moment to meet it …
//   wss://<relay>/session/?host=<invite>&guest=<id>   … on one more connection. From then on the two talk to each other,
//                                                     and the relay only passes their frames.
//   https://<relay>/?invite=<invite>                  the app itself: static files (scripts/assets.mjs), served by
//                                                     Cloudflare without running this Worker
//
// One Durable Object per invite holds the sockets that belong to it. The
// sockets are accepted for hibernation: an object nobody speaks through costs
// nothing while its connections stay open, and what it needs to know about a
// socket rides on the socket (its tags and attachment), not in memory.
//
// The relay keeps nothing: no model, no account, no log of what passed. An
// invite is the key to its session — whoever has the link is let in — and the
// host can take it back by closing its connection.
import { DurableObject } from 'cloudflare:workers'
import { verify, type AuthEnv } from './auth'

export type Env = AuthEnv & { SESSIONS: DurableObjectNamespace<Session> }

/** What an invite looks like (the MCP mints UUIDs). */
const TOKEN = /^[A-Za-z0-9_-]{16,128}$/
/** How long a host has to meet a guest that joined. */
const MEET_TIMEOUT_MS = 10_000
/** How many guests one session takes at most: the most a plan names, and the host's own app. */
const MAX_GUESTS = 17
/**
 * Guests by the host's plan, as the plans name them (shareGuests in buerli-backend's plans.ts). Free
 * offers no sessions. A sign-in without a plan yet (a token from before the account's plan claim)
 * counts as the trial.
 */
export const GUESTS_BY_PLAN: Record<string, number> = { free: 0, trial: 2, solo: 2, pro: 16, business: 16, contract: 16 }
/** The host's own app comes in under the share link like a guest, so a session takes one more than its plan names. */
export const guestsFor = (plan: string | null): number => {
  const named = plan && plan in GUESTS_BY_PLAN ? GUESTS_BY_PLAN[plan] : 2
  return named === 0 ? 0 : Math.min(MAX_GUESTS, named + 1)
}
/** How much a guest may say before the host met it. */
const MAX_EARLY_BYTES = 1024 * 1024

/** What a socket is: kept on the socket, so it is still known after the object slept. */
type Role = { as: 'host'; uid: string; guests: number } | { as: 'guest'; id: string } | { as: 'link'; id: string } | { as: 'replaced' }

/** The account behind an offer, as the Worker tells the object (a caller's own header of that name never gets there). */
const UID_HEADER = 'x-classcad-uid'
/** How many guests the offer's plan allows, told the same way. */
const GUESTS_HEADER = 'x-classcad-guests'

const refuse = (status: number, reason: string): Response => new Response(reason, { status })

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname.replace(/\/+$/, '') !== '/session') return refuse(404, 'not found')
    if (request.headers.get('upgrade')?.toLowerCase() !== 'websocket') return refuse(426, 'a session is joined with a WebSocket')
    const hosted = url.searchParams.get('host')
    const token = hosted ?? url.searchParams.get('invite') ?? ''
    // Like a server: no invite, no session — the handshake just fails.
    if (!TOKEN.test(token)) return refuse(403, 'Forbidden')
    const headers = new Headers(request.headers)
    headers.delete(UID_HEADER)
    headers.delete(GUESTS_HEADER)
    // Offering a session is for signed-in machines, on a plan that shares. (Meeting a guest needs its id, which only the host was told.)
    if (hosted && !url.searchParams.get('guest')) {
      const account = await verify(request.headers.get('authorization'), env)
      if (!account) return refuse(401, 'Unauthorized')
      const guests = guestsFor(account.plan)
      if (guests === 0) return refuse(403, 'Sharing a session comes with Solo and up: https://classcad.ch/subscriptions')
      // One line per offer: the logs count the shares per account
      console.log(JSON.stringify({ event: 'offer', uid: account.uid, plan: account.plan, guests }))
      headers.set(UID_HEADER, account.uid)
      headers.set(GUESTS_HEADER, String(guests))
    }
    return env.SESSIONS.get(env.SESSIONS.idFromName(token)).fetch(new Request(request, { headers }))
  },
} satisfies ExportedHandler<Env>

/** One invite: its host, and the guests that joined with it. */
export class Session extends DurableObject<Env> {
  /** Guests the host has not met yet: what they said so far, and the timer that gives up on the host. (A pending timer keeps the object awake, so this is not lost to sleep.) */
  private waiting = new Map<string, { early: Array<string | ArrayBuffer>; bytes: number; timer: ReturnType<typeof setTimeout> }>()

  private host(): WebSocket | undefined {
    return this.ctx.getWebSockets('host').find(socket => (socket.deserializeAttachment() as Role | null)?.as === 'host')
  }
  private guest(id: string): WebSocket | undefined {
    return this.ctx.getWebSockets(`guest:${id}`)[0]
  }
  private link(id: string): WebSocket | undefined {
    return this.ctx.getWebSockets(`link:${id}`)[0]
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const hosted = url.searchParams.get('host')
    const meets = url.searchParams.get('guest')
    let role: Role
    if (hosted && meets) {
      // The host, meeting one guest. A guest is met once.
      if (!this.guest(meets) || this.link(meets)) return refuse(404, 'Not Found')
      role = { as: 'link', id: meets }
    } else if (hosted) {
      const uid = request.headers.get(UID_HEADER) ?? ''
      const before = this.host()
      if (before) {
        // An invite is offered once — but a host that lost its connection (a closed laptop, another network) may
        // come back before anybody noticed that the old one is dead. Its guests stay: they are met on connections of their own.
        const was = before.deserializeAttachment() as Role | null
        if (was?.as !== 'host' || was.uid !== uid) return refuse(409, 'Conflict')
        before.serializeAttachment({ as: 'replaced' } satisfies Role)
        shut(before, 1012, 'offered again on another connection')
      }
      role = { as: 'host', uid, guests: Number(request.headers.get(GUESTS_HEADER)) || 0 }
    } else {
      const host = this.host()
      if (!host) return refuse(403, 'Forbidden')
      const offered = host.deserializeAttachment() as Role | null
      const limit = offered?.as === 'host' ? Math.min(MAX_GUESTS, offered.guests) : MAX_GUESTS
      if (this.ctx.getWebSockets('guest').length >= limit) return refuse(503, 'this session is full')
      role = { as: 'guest', id: crypto.randomUUID() }
    }

    const { 0: client, 1: socket } = new WebSocketPair()
    this.ctx.acceptWebSocket(socket, role.as === 'guest' || role.as === 'link' ? [role.as, `${role.as}:${role.id}`] : ['host'])
    socket.serializeAttachment(role)

    if (role.as === 'guest') {
      // The host is told, and has a moment to meet the guest.
      const { id } = role
      const timer = setTimeout(() => {
        this.waiting.delete(id)
        shut(socket, 1011, 'the host did not answer')
      }, MEET_TIMEOUT_MS)
      this.waiting.set(id, { early: [], bytes: 0, timer })
      this.host()?.send(JSON.stringify({ relay: 'guest', guest: id }))
    } else if (role.as === 'link') {
      // What the guest said before the host was there is not lost.
      const waiting = this.waiting.get(role.id)
      if (waiting) {
        this.waiting.delete(role.id)
        clearTimeout(waiting.timer)
        for (const message of waiting.early) socket.send(message)
      }
    }
    return new Response(null, { status: 101, webSocket: client })
  }

  webSocketMessage(socket: WebSocket, message: string | ArrayBuffer): void {
    const role = socket.deserializeAttachment() as Role | null
    // The host's standing connection has nothing to say: it is told of guests.
    if (!role || role.as === 'host' || role.as === 'replaced') return
    if (role.as === 'link') return this.pass(socket, this.guest(role.id), message)
    const link = this.link(role.id)
    if (link) return this.pass(socket, link, message)
    const waiting = this.waiting.get(role.id)
    // Neither met nor waiting: the host is gone, or never came.
    if (!waiting) return shut(socket, 1011, 'the host did not answer')
    waiting.bytes += typeof message === 'string' ? message.length : message.byteLength
    if (waiting.bytes > MAX_EARLY_BYTES) return this.gone(socket, 1009, 'too much, too early')
    waiting.early.push(message)
  }

  /** One frame, from one side of a meeting to the other. */
  private pass(from: WebSocket, to: WebSocket | undefined, message: string | ArrayBuffer): void {
    if (!to) return this.gone(from, 1000, '')
    try {
      to.send(message)
    } catch {
      // A frame the other side cannot be sent (too big, or it is closing): the meeting is over.
      this.gone(from, 1009, 'a frame could not be passed on')
    }
  }

  webSocketClose(socket: WebSocket, code: number, reason: string): void {
    this.gone(socket, code, reason)
  }

  webSocketError(socket: WebSocket): void {
    this.gone(socket, 1011, 'connection error')
  }

  /** A socket is gone, or has to go: so is what depended on it. */
  private gone(socket: WebSocket, code: number, reason: string): void {
    const role = socket.deserializeAttachment() as Role | null
    shut(socket, code, reason)
    // A host's connection that another one took over ends alone.
    if (!role || role.as === 'replaced') return
    if (role.as === 'host') {
      // The host is gone: so is its session, for everyone in it.
      for (const waiting of this.waiting.values()) clearTimeout(waiting.timer)
      this.waiting.clear()
      for (const other of this.ctx.getWebSockets()) if (other !== socket) shut(other, 1001, 'the session is over')
      return
    }
    const waiting = this.waiting.get(role.id)
    if (waiting) {
      clearTimeout(waiting.timer)
      this.waiting.delete(role.id)
    }
    // The two sides of a meeting end together, and each hears why the other went (an invite taken back, a session that moved).
    const other = role.as === 'guest' ? this.link(role.id) : this.guest(role.id)
    if (other) shut(other, code, reason)
  }
}

/** Closes a WebSocket that may be closing already, with a code a close frame may carry. */
function shut(socket: WebSocket, code: number, reason: string): void {
  const sendable = code === 1000 || (code >= 1001 && code <= 1014 && code !== 1004 && code !== 1005 && code !== 1006) || (code >= 3000 && code <= 4999)
  try {
    socket.close(sendable ? code : 1000, sendable ? reason.slice(0, 120) : '')
  } catch {
    /* already closing */
  }
}
