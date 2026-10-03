// share/session.ts — an MCP session as a participant of a shared session.
//
// Whichever engine the session runs on, it can have company: apps docked into
// the MCP's own engine (share/hub.ts, the MCP is the host), or the other
// participants of a session on a ClassCAD server (the MCP hosts it or joined
// it by invite). This module is the one view of that company the tools use:
//   • who is there, and what they say about themselves ('client' presence)
//   • what they have selected ('selection' presence), and asking them to
//     select something ('select' presence)
//   • the link of the app that docks into this session, and opening it
//   • the link for everybody else: the session offered on the share relay
//     (share/relay.ts), where it is joined from anywhere
// The frames come from the hub (own engine) or from the server (worker) — the
// same frames either way.
import { randomUUID } from 'node:crypto'
import type { Client } from '../client.js'
import { openBrowser } from '../auth.js'
import { createSessionHub, type Invite, type SessionHub } from './hub.js'
import { offerOnRelay, relayUrl, type RelayOffer } from './relay.js'
import { appAvailable, listen, offerInvite } from './server.js'
import {
  CLIENT_CHANNEL,
  SELECT_CHANNEL,
  SELECTION_CHANNEL,
  type ClientIdentity,
  type Peer,
  type SelectFrame,
  type SelectionFrame,
  type SelectionItem,
  type SelectTarget,
  type SessionFrame,
} from './protocol.js'

/**
 * How a session's app reaches the user:
 *   browser  the MCP opens it in the user's default browser, with the first model
 *   host     the host has a browser pane of its own, next to the conversation (the Claude desktop
 *            app): the agent is told to open the link there, and nothing is opened from here
 *   off      nothing is opened; the agent hands over the link
 */
export type Show = 'browser' | 'host' | 'off'

/** What the environment says about it: CLASSCAD_VIEWER_OPEN (browser | host | 0), else by the host that started the MCP. */
export function showFromEnv(env: NodeJS.ProcessEnv = process.env): Show {
  const set = env.CLASSCAD_VIEWER_OPEN
  if (set === '0' || set === 'off') return 'off'
  if (set === 'browser' || set === 'host') return set
  // The Claude desktop app shows web pages in a pane of its own, beside the conversation: the app belongs there.
  return env.CLAUDE_CODE_ENTRYPOINT === 'claude-desktop' ? 'host' : 'browser'
}

/**
 * When a session gets a link that works beyond its machine (CLASSCAD_SHARE), where a relay is there to share it on:
 *   always  from its first model on (the default): the app's link IS that link, wherever the relay holds the
 *           session — one link, which the user opens and may send on. A relay that cannot be reached, or that
 *           goes away, leaves the link of this machine: the app is offered under that one instead.
 *   ask     when the user asks for one (the `share` tool): the app's link is this machine's, the other a second one
 *   off     never
 * Whichever it is, the session does not depend on the relay: the listener on this machine is always there.
 */
export type Sharing = 'ask' | 'always' | 'off'

/** What the environment says about it. Without a relay there is nothing to share on. */
export function sharingFromEnv(env: NodeJS.ProcessEnv = process.env): Sharing {
  if (!relayUrl(env)) return 'off'
  const set = env.CLASSCAD_SHARE
  return set === 'ask' ? 'ask' : set === 'off' || set === '0' ? 'off' : 'always'
}

/** How long the first model's answer waits for a relay that has not answered, where every session is shared. (It was asked when the tool started, and the app takes its time to come up anyway.) */
const OFFER_PATIENCE_MS = 6_000
/** How long somebody who asked for the link waits for the relay. */
const SHARE_PATIENCE_MS = 12_000

/** A session's link for everybody else: whether the relay holds it right now, and why not. */
export type Shared = { url: string; live: boolean; problem: string | null }

/**
 * The app, offered to the user — once per session: its link, and how it got to them or should.
 * `shared`: the link is the session's share link (it works from anywhere); else it is this machine's.
 * `fallback`: offered again, on this machine, because the share link it was offered under stopped working.
 */
export type Offer = { url: string; how: 'opened' | 'host' | 'link'; shared?: true; fallback?: true }

/** What a session's sharing is opened with. */
export type ShareOptions = {
  /** The session's engine client. */
  client: Client
  /** Runs work in the session's tool queue. */
  queue: <T>(work: () => Promise<T>) => Promise<T>
  /** Offer the app's link (this build must carry the app). */
  app: boolean
  /** How the app reaches the user. */
  show: Show
  /** When the session gets a link for everybody else. Default: what the environment says. */
  sharing?: Sharing
  /** Who this session is, for the others: asked whenever it is published (the host's name is known late). */
  identity: () => ClientIdentity
  log?: (msg: string) => void
}

/** What one participant has selected. `total` counts all of it; `items` may be cut to what fits a presence frame. */
export type PeerSelection = { peer: Peer; items: SelectionItem[]; total: number }

/** A session's company, as its tools use it. */
export type Share = {
  /** The link that docks the app into this session on this machine; null when this build carries no app or the listener did not start. */
  readonly url: string | null
  /** The link the app is offered under right now: the share link where every session is shared and the relay holds this one, else `url`. */
  readonly appUrl: string | null
  /** False while this session is a guest in somebody else's (use_session with an invite): theirs is the app the user has open. */
  readonly hosting: boolean
  /** How the app reaches the user. */
  readonly show: Show
  /** When the session gets a link for everybody else. */
  readonly sharing: Sharing
  /** The link that docks the app into this session from anywhere, while the relay holds it; null otherwise. */
  readonly sharedUrl: string | null
  /**
   * Shares the session beyond this machine: an invite of its own, offered on
   * the relay. Whoever opens the link is in the session like the user at the
   * app. Shared already: the same link. Waits `patience` ms at most for the
   * relay; one that does not take the offer by then (`live: false`, with the
   * reason) is asked again in the background until it does — nothing fails,
   * the session just is not shared yet. Rejects only where a session cannot be
   * shared at all (no relay, somebody else's session).
   */
  publish: (patience?: number) => Promise<Shared>
  /** Where every session is shared: starts offering this one, without waiting for it. For the moment before the first model. */
  warm: () => void
  /** Takes the shared link back: it stops working, and whoever joined with it is disconnected (`kicked`). Null when the session was not shared. */
  unpublish: () => { kicked: number } | null
  /** Opens the app in the user's default browser now (`link`: under that link; default `appUrl`). False where there is no browser to open. */
  open: (link?: string) => boolean
  /**
   * A tool ran that may have changed the model or the engine. With the first
   * model of a session the app is offered, once: the answer says how (and in
   * `browser` mode it has been opened by then). Null every other time.
   */
  touch: () => Promise<Offer | null>
  /** The agent was handed `link` some other way (`view`): the app is not offered again. */
  offered: (link?: string) => void
  /** How many apps are in the session (agents not counted): somebody has it open. */
  docked: () => number
  /** Everyone else in the session, as far as this session knows. */
  peers: () => Peer[]
  /** What the others have selected: one entry per participant that shares its selection. */
  selections: () => PeerSelection[]
  /** Asks the others to select `items`, and returns what they have selected a moment later. */
  select: (items: SelectTarget[], replace?: boolean) => Promise<PeerSelection[]>
  /** The session is over: the link stops working, docked apps are told. */
  close: () => void
}

/** Tests set this: nothing is opened on the machine they run on. */
const noBrowser = () => process.env.CLASSCAD_VIEWER_NO_BROWSER === '1'

/** A drawing nobody modeled in yet: nothing in its tree but the root. */
const isEmpty = (tree: Record<string, any> | null | undefined): boolean => !tree || Object.values(tree).every(n => n?.class === 'AllObjects')

/**
 * Opens a session's sharing: its hub, the app's invite on the listener, and an
 * ear for whoever is in the session. Nothing is started: the engine comes up
 * with the first tool call, or with the first guest.
 */
export async function openShare(opts: ShareOptions): Promise<Share> {
  const { client } = opts
  const log = opts.log ?? (() => {})

  let published = ''

  // ── Who is there, and what they last said ──
  const peers = new Map<string, Peer>()
  const said = new Map<string, Map<string, Record<string, any>>>()
  const listeners = new Set<(peerId: string, channel: string) => void>()

  const forget = (peerId: string) => {
    peers.delete(peerId)
    said.delete(peerId)
  }
  // The engine link this session's company belongs to.
  let transport: string | null = null
  const hear = (frame: SessionFrame): void => {
    const peerId = typeof frame.peerId === 'string' ? frame.peerId : ''
    if (frame.command === 'Connected') {
      // Another engine link: whoever was docked or known belongs to the old one.
      // (The MCP's own engine restarting is not one: its guests stay, the hub sends them the model anew.)
      const moved = transport !== null && (frame.transport !== transport || frame.transport === 'ws')
      transport = frame.transport
      if (moved) {
        hub.kick('the session moved to another engine')
        peers.clear()
        said.clear()
      }
      published = ''
      if (frame.transport === 'ws') publishIdentity()
    } else if (frame.command === 'PeerJoined' && peerId) {
      peers.set(peerId, { ...peers.get(peerId), peerId, invite: frame.invite, inviteName: frame.inviteName, role: frame.role === 'view' ? 'view' : 'edit' })
      publishIdentity(true)
    } else if (frame.command === 'PeerLeft' && peerId) forget(peerId)
    else if (frame.command === 'Presence' && peerId) {
      if (frame.channel === 'leave') return forget(peerId)
      const data = frame.data && typeof frame.data === 'object' ? frame.data : {}
      // A guest never hears of joins: whoever speaks is there.
      const peer = peers.get(peerId) ?? { peerId }
      if (frame.channel === CLIENT_CHANNEL && typeof data.app === 'string') {
        peer.identity = { app: data.app, version: typeof data.version === 'string' ? data.version : undefined, name: typeof data.name === 'string' ? data.name : undefined, kind: data.kind === 'agent' ? 'agent' : 'app' }
      }
      peers.set(peerId, peer)
      let channels = said.get(peerId)
      if (!channels) said.set(peerId, (channels = new Map()))
      channels.set(frame.channel, data)
      for (const tell of listeners) tell(peerId, frame.channel)
    }
  }

  // ── The two sources of those frames ──
  const hub: SessionHub = createSessionHub({ client, queue: opts.queue, toHost: hear, log })
  const unsubServer = client.onSessionFrame(hear)

  const sendPresence = (channel: string, data: Record<string, any>): void => {
    if (client.transport === 'wasm') hub.sendPresence(channel, data)
    else client.sendFrame({ command: 'Presence', channel, data })
  }

  // Who this session is. Published again whenever it changed or the audience did.
  const publishIdentity = (again = false): void => {
    const identity = opts.identity()
    const key = `${client.transport}:${client.generation}:${JSON.stringify(identity)}`
    if (key === published && !again) return
    published = key
    sendPresence(CLIENT_CHANNEL, identity)
  }

  // ── The app's link ──
  let url: string | null = null
  let invite: Invite | null = null
  let unoffer: (() => void) | null = null
  try {
    // The listener is there for more than this session's app: pages offer their own sessions on it.
    const { port } = await listen()
    // The app this build carries — or one that is hosted elsewhere (CLASSCAD_APP_URL): any buerli app
    // that joins a page's session finds this listener by itself, on its usual port.
    const hosted = process.env.CLASSCAD_APP_URL
    if (opts.app && (hosted || appAvailable())) {
      invite = hub.createInvite('edit', 'user')
      unoffer = offerInvite(invite.invite, hub)
      url = hosted ? `${hosted}${hosted.includes('?') ? '&' : '?'}invite=${invite.invite}` : `http://127.0.0.1:${port}/?invite=${invite.invite}`
    }
  } catch (err) {
    // No listener is no reason to have no MCP.
    log(`share: the listener for apps did not start (${(err as Error)?.message ?? err})`)
  }

  // ── The link for everybody else ──
  // An invite of its own: it is taken back without a word to the user's app.
  const sharing = opts.sharing ?? sharingFromEnv()
  let shared: { invite: Invite; offer: RelayOffer } | null = null
  /** The share link was taken back (`share` with stop): the session is not shared again by itself, only when asked. */
  let stopped = false
  /** Offers the session on the relay, if it is not: returns at once, the relay is asked in the background. */
  const offerShared = (): RelayOffer => {
    if (shared) return shared.offer
    const relay = relayUrl()
    if (!relay || sharing === 'off') throw new Error('Sessions are not shared from this MCP: no relay is configured (CLASSCAD_RELAY_URL), or sharing is switched off (CLASSCAD_SHARE=off).')
    // A guest cannot invite: the session is its host's to share.
    if (client.shareToken) throw new Error('This session belongs to an app the user has open: it is shared from there (its Sessions panel), not from here.')
    // Where the share link is the app's link, the user comes in with it too.
    const guest = hub.createInvite('edit', sharing === 'always' ? 'user' : 'guest')
    shared = { invite: guest, offer: offerOnRelay({ relay, hub, invite: guest.invite, log }) }
    return shared.offer
  }
  const publish = async (patience = SHARE_PATIENCE_MS): Promise<Shared> => {
    const offer = offerShared()
    stopped = false
    const live = await offer.whenLive(patience)
    return { url: offer.url, live, problem: live ? null : offer.problem ?? 'the relay has not answered yet' }
  }
  const warm = (): void => {
    if (sharing !== 'always' || stopped || shared || client.shareToken) return
    try {
      offerShared()
    } catch {
      /* not a session to share: the app is still there */
    }
  }
  const unpublish = (): { kicked: number } | null => {
    if (!shared) return null
    const { invite: guest, offer } = shared
    shared = null
    stopped = true
    // Whoever had the app open under that link is told by whoever took it back: it is not offered again on its own.
    if (offeredOn === 'relay') offeredOn = 'here'
    // Each guest hears why it has to go, before the relay ends what is left.
    const { kicked } = hub.revokeInvite(guest.invite)
    offer.close()
    log(`share: the session is not shared any more (${kicked} guest(s) disconnected)`)
    return { kicked }
  }

  /** The link the app is offered under right now. */
  const appUrl = (): string | null => (sharing === 'always' && shared?.offer.live ? shared.offer.url : url)

  // The app is offered once per session. Said again and again, an agent repeats its link in every answer.
  let offered = false
  /** Which link it was offered under: one on the relay may stop working, and then the app is offered again, on this machine. */
  let offeredOn: 'relay' | 'here' | null = null
  const handed = (link: string | null): void => {
    offered = true
    offeredOn = link !== null && link === shared?.offer.url ? 'relay' : 'here'
  }
  const open = (link: string | null = appUrl()): boolean => {
    if (!link) return false
    handed(link)
    return noBrowser() ? false : openBrowser(link)
  }
  /** The app under `link`, the way this session's host shows it. */
  const present = (link: string, more: Pick<Offer, 'shared' | 'fallback'>): Offer => {
    handed(link)
    if (opts.show === 'host') return { url: link, how: 'host', ...more }
    if (opts.show === 'browser' && open(link)) return { url: link, how: 'opened', ...more }
    return { url: link, how: 'link', ...more }
  }
  const docked = (): number => Math.max(hub.guests, [...peers.values()].filter(peer => peer.identity?.kind !== 'agent').length)

  const touch = async (): Promise<Offer | null> => {
    if (client.connected) publishIdentity()
    // A session that became somebody's guest (use_session with an invite) is not this MCP's to share any more.
    if (client.shareToken && shared) unpublish()
    // A guest has nothing to offer: the host's app is open.
    if (!url || client.shareToken) return null
    if (offered) {
      // The app was offered under the share link, the relay does not hold the session any more, and nobody is left
      // in it: whoever had the app open lost it. It is offered again, once, on this machine.
      if (offeredOn !== 'relay' || shared?.offer.live || docked() > 0) return null
      log('share: the share link stopped working — the app is offered on this machine')
      return present(url, { fallback: true })
    }
    // Somebody has it open already: there is nothing to bring up, and nothing to say.
    if (docked() > 0) {
      offered = true
      return null
    }
    try {
      if (!client.connected || isEmpty((await client.getTree()) as Record<string, any>)) return null
    } catch {
      return null
    }
    // The first model of the session: now.
    // Where every session is shared, the app's link is the share link — if the relay holds the session by now.
    // A relay that does not is no reason to have no app: then the link is this machine's.
    let link: Shared | null = null
    if (sharing === 'always' && !stopped) {
      try {
        const relayed = offerShared()
        // An offer the relay has turned down already is not waited for: it is made again in the background.
        link = relayed.live || !relayed.problem ? await publish(OFFER_PATIENCE_MS) : { url: relayed.url, live: false, problem: relayed.problem }
      } catch {
        /* not a session to share */
      }
    }
    if (link && !link.live) log(`share: the app is offered on this machine only (${link.problem})`)
    return link?.live ? present(link.url, { shared: true }) : present(url, {})
  }

  const selections = (): PeerSelection[] => {
    const out: PeerSelection[] = []
    for (const [peerId, channels] of said) {
      const frame = channels.get(SELECTION_CHANNEL) as Partial<SelectionFrame> | undefined
      if (!frame || !Array.isArray(frame.items)) continue
      out.push({ peer: peers.get(peerId) ?? { peerId }, items: frame.items, total: typeof frame.total === 'number' ? frame.total : frame.items.length })
    }
    return out
  }

  const select = async (items: SelectTarget[], replace = true): Promise<PeerSelection[]> => {
    const id = randomUUID()
    // Whoever follows the request publishes its selection anew: wait for that, briefly.
    const answered = new Promise<void>(resolve => {
      const done = () => {
        listeners.delete(tell)
        clearTimeout(timer)
        resolve()
      }
      const tell = (_peerId: string, channel: string) => {
        if (channel === SELECTION_CHANNEL) setTimeout(done, 60)
      }
      const timer = setTimeout(done, 1500)
      listeners.add(tell)
    })
    sendPresence(SELECT_CHANNEL, { id, items, replace } satisfies SelectFrame)
    // The frame a server keeps for those who join later must ask for nothing.
    sendPresence(SELECT_CHANNEL, { id, done: true } satisfies SelectFrame)
    await answered
    return selections()
  }

  return {
    get url() {
      return url
    },
    get hosting() {
      return !client.shareToken
    },
    show: opts.show,
    sharing,
    get appUrl() {
      return appUrl()
    },
    get sharedUrl() {
      return shared?.offer.live ? shared.offer.url : null
    },
    publish,
    warm,
    unpublish,
    open,
    touch,
    offered: (link = appUrl() ?? undefined) => handed(link ?? null),
    docked,
    peers: () => [...peers.values()],
    selections,
    select,
    close: () => {
      unoffer?.()
      unsubServer()
      shared?.offer.close()
      shared = null
      hub.close()
      peers.clear()
      said.clear()
    },
  }
}
