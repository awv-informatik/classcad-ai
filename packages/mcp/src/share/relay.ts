// share/relay.ts — a session's address beyond this machine.
//
// The listener sessions are joined on binds 127.0.0.1 (share/server.ts): the
// app on this machine docks there, and nobody else can. A session that
// somebody elsewhere is to join is offered on the share relay instead
// (packages/relay, a Cloudflare Worker) — the way a page that hosts its own
// session offers it on the listener, with the same three connections. Only
// that here the MCP is the one that dials out:
//
//   wss://<relay>/session/?host=<invite>               a standing connection: the invite is offered for as long as it lasts
//   { relay: 'guest', guest: <id> }                    the relay's word on it: somebody joined with the invite
//   wss://<relay>/session/?host=<invite>&guest=<id>    the MCP meets that guest on one more connection, and hands it to
//                                                      the session's hub — which serves it like a guest of the listener
//   https://<relay>/?invite=<invite>                   what the guest opened: the app, served by the relay
//
// Nothing here listens for the outside: every connection is one this process
// opened. The relay takes an offer only from a signed-in machine (it is shown
// the Firebase ID token of the sign-in), passes the frames of a meeting and
// keeps none. The invite is the key, as on the listener: whoever has the link
// is in, until the offer is closed.
import WebSocket from 'ws'
import { authStatus, idToken } from '../auth.js'
import type { SessionHub } from './hub.js'
import { SESSION_PATH } from './server.js'

/**
 * The relay sessions are shared on when nothing names another one: the one
 * packages/relay deploys (`npm run deploy` there). Without a relay (`off`) a
 * session stays on its machine, and the `share` tool is not there.
 */
export const DEFAULT_RELAY_URL = 'https://classcad-share.it-5ca.workers.dev'

/** The relay's address (https://…), or null where sessions are not shared: CLASSCAD_RELAY_URL (`off`: none), else the default. */
export function relayUrl(env: NodeJS.ProcessEnv = process.env): string | null {
  const named = (env.CLASSCAD_RELAY_URL ?? DEFAULT_RELAY_URL).trim()
  if (!named || named === 'off' || named === '0') return null
  return named.replace(/\/+$/, '')
}

/** How often the standing connection is pinged; one that misses a beat is taken for dead. */
const HEARTBEAT_MS = 30_000
/** How long a handshake with the relay may take. */
const HANDSHAKE_MS = 15_000
/** The pauses before an offer that was lost is made again: the last one is repeated. */
const RETRY_MS = [1_000, 2_000, 5_000, 10_000, 30_000]
/** After the relay said the plan does not share (Free): asked again this much later, with a fresh sign-in, so an upgrade counts. */
const PLAN_RETRY_MS = 10 * 60_000
/** The largest frame taken from a guest: what the listener takes (share/server.ts). */
const MAX_PAYLOAD = 256 * 1024 * 1024

/**
 * An invite, offered on the relay — or about to be: an offer the relay does
 * not take (it cannot be reached, it is down, the machine's sign-in is not
 * confirmed) is made again until it does, and so is one that was lost.
 * Nothing here fails for good, and nothing has to wait for it.
 */
export type RelayOffer = {
  /** The link that docks the app into the session, from anywhere: good while the offer is `live`. */
  readonly url: string
  /** True while the relay holds the offer. */
  readonly live: boolean
  /** Why the relay does not hold the offer right now; null while it does, and before it answered the first time. */
  readonly problem: string | null
  /** Waits until the relay holds the offer, `ms` at most. False when it still does not by then (it is still being offered). */
  whenLive: (ms: number) => Promise<boolean>
  /** Takes the offer back. The relay ends the guests' connections with it. */
  close: () => void
}

export type RelayOptions = {
  /** The relay's address (https://… or http://…). */
  relay: string
  /** The session's hub: guests the relay brings are handed to it. */
  hub: SessionHub
  /** The invite to offer: one the hub minted. */
  invite: string
  log?: (msg: string) => void
}

/** Why the relay did not take a connection, in words for the user. */
const refusal = (status: number | undefined): string =>
  status === 401
    ? 'the relay did not accept this machine\'s sign-in'
    : status === 403
      ? 'sharing a session comes with Solo and up (https://classcad.ch/subscriptions); on Free the session stays on this machine'
      : status === 409
        ? 'the relay holds this invite for somebody else'
        : `the relay answered HTTP ${status ?? '?'}`

/**
 * Offers an invite of a session on the relay, and keeps it offered: an offer
 * the relay does not take, and a connection that is lost (a sleeping laptop,
 * another network, a relay that was redeployed), is made again. Guests the
 * relay brings are met and handed to the hub. Returns at once: whenLive()
 * tells when the relay has it.
 */
export function offerOnRelay(opts: RelayOptions): RelayOffer {
  const { hub, invite } = opts
  const log = opts.log ?? (() => {})
  const relay = opts.relay.replace(/\/+$/, '')
  const offerUrl = `${relay.replace(/^http/i, 'ws')}${SESSION_PATH}/?host=${encodeURIComponent(invite)}`

  let closed = false
  let live = false
  let problem: string | null = null
  /** Whoever waits for the offer to be taken (whenLive). */
  const waiters = new Set<(live: boolean) => void>()
  let control: WebSocket | null = null
  let retry: ReturnType<typeof setTimeout> | null = null
  let failures = 0
  /** The relay turned the last offer down for the plan. */
  let planRefused = false
  let offeredBefore = false
  /** The connections guests were met on. */
  const links = new Set<WebSocket>()

  /** Somebody joined with the invite: met on a connection of its own, and from there on a guest of the hub. */
  const meet = async (guest: string): Promise<void> => {
    // The engine behind the session is the signed-in machine's. (A guest nobody meets is sent away by the relay.)
    if (closed || !(await authStatus()).signedIn) return
    const link = new WebSocket(`${offerUrl}&guest=${encodeURIComponent(guest)}`, { handshakeTimeout: HANDSHAKE_MS, maxPayload: MAX_PAYLOAD })
    links.add(link)
    link.once('open', () => hub.join(link, invite))
    link.once('close', () => links.delete(link))
    link.on('error', err => {
      links.delete(link)
      log(`share: a guest of the relay was not met (${err.message})`)
    })
  }

  /** Opens the standing connection. Resolves when the relay took the offer. */
  const offer = async (): Promise<void> => {
    const token = await idToken(planRefused)
    if (!token) throw new Error('this machine is not signed in (or the sign-in could not be confirmed)')
    if (closed) return
    await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(offerUrl, { headers: { authorization: `Bearer ${token}` }, handshakeTimeout: HANDSHAKE_MS })
      control = ws
      let alive = true
      let beat: ReturnType<typeof setInterval> | null = null
      ws.once('open', () => {
        if (closed) return ws.close(1000)
        live = true
        problem = null
        failures = 0
        planRefused = false
        for (const tell of [...waiters]) tell(true)
        ws.on('pong', () => (alive = true))
        beat = setInterval(() => {
          if (!alive) return ws.terminate()
          alive = false
          ws.ping()
        }, HEARTBEAT_MS)
        beat.unref()
        resolve()
      })
      ws.once('unexpected-response', (_req, res) => {
        res.resume()
        planRefused = res.statusCode === 403
        reject(new Error(refusal(res.statusCode)))
        ws.terminate()
      })
      ws.on('message', data => {
        let frame: { relay?: unknown; guest?: unknown }
        try {
          frame = JSON.parse(data.toString())
        } catch {
          return
        }
        if (frame?.relay === 'guest' && typeof frame.guest === 'string') void meet(frame.guest).catch(err => log(`share: ${(err as Error)?.message ?? err}`))
      })
      ws.on('error', err => reject(err))
      ws.on('close', () => {
        if (beat) clearInterval(beat)
        if (control !== ws) return
        control = null
        // An offer that was taken and then lost is made again. (One that was not taken: whoever made it does that.)
        if (live && !closed) {
          problem = 'the connection to the relay was lost'
          log(`share: ${problem}`)
          again()
        }
        live = false
      })
    })
  }

  /** Makes the offer; one the relay does not take is made again after a pause, for as long as it takes. */
  const attempt = (): void => {
    offer().then(
      () => {
        if (closed) return
        log(`share: offered on the relay${offeredBefore ? ' again' : ''}`)
        offeredBefore = true
      },
      err => {
        if (closed) return
        problem = (err as Error)?.message || String(err)
        // Said once per outage: the pauses grow, the reason stays the same.
        if (!failures) log(`share: the relay did not take the offer (${problem}) — it is made again until it does`)
        again()
      },
    )
  }
  const again = (): void => {
    const pause = planRefused ? PLAN_RETRY_MS : RETRY_MS[Math.min(failures, RETRY_MS.length - 1)]
    failures++
    retry = setTimeout(() => {
      retry = null
      if (!closed) attempt()
    }, pause)
    retry.unref()
  }
  attempt()

  return {
    url: `${relay}/?invite=${encodeURIComponent(invite)}`,
    get live() {
      return live
    },
    get problem() {
      return problem
    },
    whenLive: ms =>
      live || closed
        ? Promise.resolve(live)
        : new Promise(resolve => {
            const tell = (now: boolean) => {
              clearTimeout(timer)
              waiters.delete(tell)
              resolve(now)
            }
            const timer = setTimeout(() => tell(false), ms)
            timer.unref()
            waiters.add(tell)
          }),
    close: () => {
      if (closed) return
      closed = true
      live = false
      for (const tell of [...waiters]) tell(false)
      if (retry) clearTimeout(retry)
      for (const ws of [control, ...links]) {
        try {
          ws?.close(1001, 'the session is over')
        } catch {
          /* already closing */
        }
      }
      links.clear()
    },
  }
}
