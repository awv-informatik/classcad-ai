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
// The frames come from the hub (own engine) or from the server (worker) — the
// same frames either way.
import { randomUUID } from 'node:crypto'
import type { Client } from '../client.js'
import { openBrowser } from '../auth.js'
import { createSessionHub, type Invite, type SessionHub } from './hub.js'
import { appAvailable, listen, offerInvite } from './server.js'
import {
  CLIENT_CHANNEL,
  CONFIG_CHANNEL,
  SELECT_CHANNEL,
  SELECTION_CHANNEL,
  type ClientIdentity,
  type Peer,
  type SelectFrame,
  type SelectionFrame,
  type SelectionItem,
  type SelectTarget,
  type SessionConfig,
  type SessionFrame,
} from './protocol.js'

/**
 * What this MCP's sessions offer their guests: the formats its own tools hand
 * out. OFB is not among them in this release (client.ts, ofbExportRefusal) —
 * apps hide what is not offered, and the hub refuses it all the same.
 */
const OFFERED: SessionConfig = { saveFormats: ['STP', 'STL'] }

export type ShareOptions = {
  client: Client
  /** Runs work in the session's tool queue. */
  queue: <T>(work: () => Promise<T>) => Promise<T>
  /** Offer the app's link (this build must carry the app). */
  app: boolean
  /** Who this session is, for the others: asked whenever it is published (the host's name is known late). */
  identity: () => ClientIdentity
  log?: (msg: string) => void
}

export type PeerSelection = { peer: Peer; items: SelectionItem[]; total: number }

export type Share = {
  /** The link that docks the app into this session; null when this build carries no app or the listener did not start. */
  readonly url: string | null
  /** False while this session is a guest in somebody else's (use_session with an invite): theirs is the app the user has open. */
  readonly hosting: boolean
  /** Opens the app in the user's browser now. False where there is no browser to open. */
  open: () => boolean
  /** A tool ran that may have changed the model or the engine: the first model brings the app up, once. */
  touch: () => Promise<void>
  /** Everyone else in the session, as far as this session knows. */
  peers: () => Peer[]
  /** What the others have selected: one entry per participant that shares its selection. */
  selections: () => PeerSelection[]
  /** Asks the others to select `items`, and returns what they have selected a moment later. */
  select: (items: SelectTarget[], replace?: boolean) => Promise<PeerSelection[]>
  /** The session is over: the link stops working, docked apps are told. */
  close: () => void
}

const noBrowser = () => process.env.CLASSCAD_VIEWER_NO_BROWSER === '1'

const isEmpty = (tree: Record<string, any> | null | undefined): boolean => !tree || Object.values(tree).every(n => n?.class === 'AllObjects')

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
    // Only a host's word counts on this channel: a server drops it from a guest.
    sendPresence(CONFIG_CHANNEL, OFFERED)
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

  let opened = false
  const open = (): boolean => {
    if (!url) return false
    opened = true
    return noBrowser() ? false : openBrowser(url)
  }

  const touch = async (): Promise<void> => {
    if (client.connected) publishIdentity()
    // The first model of a session brings the app up, once. (A guest has nothing to bring up: the host's app is open.)
    if (!url || opened || hub.guests > 0 || client.shareToken) return
    if (process.env.CLASSCAD_VIEWER_OPEN === '0') return
    try {
      if (!client.connected || isEmpty((await client.getTree()) as Record<string, any>)) return
    } catch {
      return
    }
    open()
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
    open,
    touch,
    peers: () => [...peers.values()],
    selections,
    select,
    close: () => {
      unoffer?.()
      unsubServer()
      hub.close()
      peers.clear()
      said.clear()
    },
  }
}
