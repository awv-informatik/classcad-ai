// share/hub.ts — a ClassCAD server's session layer, for the MCP's own engine.
//
// On a server a session is shared by invite: guests connect with
// ?invite=<token>, the server fans every command's frames out to everyone and
// relays presence. The MCP's own engine (engine/wasm.ts) has no server around
// it — this module is that part of one. The MCP session is the host; apps
// (buerli's WSClient, unchanged) and other agents are guests.
//
// A guest sends what it would send a server and gets a server's frames back:
//   SessionJoined, then the presence snapshot
//   per command  StructurePatch · Graphic · Result   (streaming connections)
//                Result with the graphic on it        (bundled connections)
//   Presence     from the other guests and from the host
// The engine itself speaks an older dialect (Patch/ops, binary packages, the
// value nested in `result`); pieces() translates it.
//
// Where this differs from a server, and why:
//   • Emission. A server generates per command what the ORIGINATOR's
//     connection asked for, so a client that suppresses its emission starves
//     the others until someone pulls. The published engine always generates
//     everything, so here every participant gets every change, in the form its
//     own connection asked for. Get/SetEmissionConfig are answered here and
//     only decide that form.
//   • Order. A guest's command waits for the session's tool queue: it never
//     lands in the middle of an agent's script. Pulls (GetTree) do not wait.
//   • Database settings are the engine's, shared by all: the ones the MCP's
//     renders need stay on, whatever a guest sets.
//   • OFB. What the MCP's tools refuse, guests are refused too.
//
// A session that runs on a ClassCAD worker needs none of this: the server
// speaks the protocol itself. Guests of such a session are piped through to
// it (pipe()), so the app's link is the same for both engines.
//
// An engine that runs in the page of an app is served the same way by that
// page: session/host.ts in @buerli.io/classcad is this module's twin (the same
// translation, the same forms). Keep the two in step.
import WebSocket from 'ws'
import { randomUUID } from 'node:crypto'
import { deflateRawSync } from 'node:zlib'
import { GRAPHIC_SETTINGS, ofbExportRefusal, type Client } from '../client.js'
import type { EngineExecuteResult } from '../engine/wasm.js'
import { DEFAULT_EMISSION, HOST_CHANNELS, PRESENCE_MAX_BYTES, SERVER_CHANNELS, type Role, type SessionFrame } from './protocol.js'

/** An invite to this session: the token a guest joins with, what it may do, and a name to show for it. */
export type Invite = { invite: string; role: Role; name: string }

/** What a guest sent before it could be answered. */
type Early = Array<{ data: WebSocket.RawData; isBinary: boolean }>

/** A guest that is served here (the session runs on the MCP's own engine). */
type Guest = {
  peerId: string
  ws: WebSocket
  invite: Invite
  /** This connection's emission config (decides the form of what it is sent). */
  config: Record<string, boolean | number>
  /** Last presence frame per channel, for those who join later. */
  presence: Map<string, Record<string, any>>
}

/** What a hub is given by its session. */
export type HubOptions = {
  /** The session's engine client: its replies are fanned out, guests' commands run on it. */
  client: Client
  /** Runs work in the session's tool queue. */
  queue: <T>(work: () => Promise<T>) => Promise<T>
  /** The frames a server would send the host: PeerJoined, PeerLeft, Presence. */
  toHost: (frame: SessionFrame) => void
  log?: (msg: string) => void
}

/** A session's sharing, as the host uses it. */
export type SessionHub = {
  /** The host's peer id, as guests see it on presence frames. */
  readonly hostId: string
  /** Mints an invite. It stays good for the life of the session, across engines. */
  createInvite: (role?: Role, name?: string) => Invite
  /** Takes an invite back; whoever joined with it is closed (`kicked`). */
  revokeInvite: (token: string) => { invite: string; revoked: boolean; kicked: number }
  /** The invite behind a token, if this session minted it. */
  invite: (token: string) => Invite | undefined
  /** A guest's socket; `token` is a known invite. */
  join: (ws: WebSocket, token: string) => void
  /** Presence from the host to every guest (kept for those who join later). */
  sendPresence: (channel: string, data: Record<string, any>) => void
  /** Sends every guest the whole model again: after the engine was replaced, or when in doubt. */
  resync: () => Promise<void>
  /** Closes every guest (the engine behind the session is another one now); invites stay. */
  kick: (reason: string) => void
  /** How many guests are in the session, served here or piped through to a server. */
  readonly guests: number
  /** The session is over: every guest is closed, every invite forgotten. */
  close: () => void
}

/** Pulls: they change nothing, so they concern only the one who asked and need not wait for the tool queue. */
const READS = new Set(['GetTree', 'Sync'])
/** The engine's message level for an error; a Result at this level rejects in the client. */
const ERROR = 51
/** How often a guest is pinged; one that misses a beat is closed. */
const HEARTBEAT_MS = 30_000

/** A Result frame that fails `req`, the way a server words an error. */
const errorResult = (req: Record<string, any>, message: string, code = 0): Record<string, any> => ({
  command: 'Result',
  _from_: String(req.command),
  _transactionID_: req.transactionID,
  maxLevel: ERROR,
  messages: [{ message, level: ERROR, levelStr: 'ERROR', code, timestamp: Date.now() }],
})

/** A streaming connection (buerli's WSClient) takes patches and graphics as frames of their own. */
const streams = (cfg: Record<string, boolean | number>): boolean => cfg.sendStructure_Patch === true

/** One engine reply, taken apart. */
type Pieces = {
  /** The command the reply answers, and its transaction id: every frame of the reply carries both. */
  from: string
  tx: unknown
  /** JSON-Patch blocks against the structure, in emission order. */
  patches: unknown[][]
  /** Graphic packages (the containers the command changed). */
  packages: Record<string, any>[]
  /** GetTree/Sync: the structure. */
  structure?: unknown
  /** The Result frame without structure and graphic. */
  result: Record<string, any>
}

/** Translates one reply of the engine into what a server's frames are made of. */
export function pieces(req: Record<string, any>, res: EngineExecuteResult): Pieces {
  const from = String(req.command)
  const tx = req.transactionID
  const out: Pieces = { from, tx, patches: [], packages: res.binaryMessages ?? [], result: { command: 'Result', _from_: from, _transactionID_: tx } }
  // Errors the engine reported on the side (errorState 2 and up).
  const side: Record<string, any>[] = []
  let answer: Record<string, any> | undefined
  for (const m of res.messages ?? []) {
    if (m?.command === 'Patch' && Array.isArray(m.ops) && m.ops.length) out.patches.push(m.ops)
    else if (m?.command === 'ErrorMessage' && Number(m.attributes?.errorState) >= 2)
      side.push({ level: ERROR, levelStr: 'ERROR', code: m.attributes?.errorCode ?? 0, message: String(m.attributes?.errorMessage ?? 'engine error') })
    else if (m?.command === 'Result') answer ??= m
  }
  if (!answer) {
    out.result = errorResult(req, side.length ? side.map(e => e.message).join('; ') : `the engine returned no result for ${from}`)
    return out
  }
  if (READS.has(from)) {
    out.structure = answer.structure ?? answer.result
    return out
  }
  let value = answer.result
  let maxLevel: number | undefined = typeof answer.maxLevel === 'number' ? answer.maxLevel : undefined
  let messages: unknown[] | undefined = Array.isArray(answer.messages) ? answer.messages : undefined
  let streamData = answer.streamData
  // The engine nests an Execute's value next to its level and messages: { result, maxLevel, messages }.
  if (from === 'Execute' && value && typeof value === 'object' && !Array.isArray(value) && 'result' in value) {
    if (typeof value.maxLevel === 'number') maxLevel = Math.max(maxLevel ?? 0, value.maxLevel)
    if (Array.isArray(value.messages)) messages = [...(messages ?? []), ...value.messages]
    streamData ??= value.streamData
    value = value.result
  }
  // An error reported only on the side must not pass as an empty success.
  if (from === 'Execute' && side.length && (maxLevel ?? 0) < ERROR && value == null) {
    maxLevel = ERROR
    messages = [...(messages ?? []), ...side]
  }
  out.result.result = value
  if (maxLevel !== undefined) out.result.maxLevel = maxLevel
  if (messages?.length) out.result.messages = messages
  if (streamData) out.result.streamData = streamData
  return out
}

/** Keeps the settings the MCP's renders need switched on in a guest's setDatabaseSettings. */
function keepGraphicSettings(req: Record<string, any>): void {
  if (!Array.isArray(req.task)) return
  for (const task of req.task) {
    if (!task || typeof task !== 'object' || !('v1.common.setDatabaseSettings' in task)) continue
    const args = task['v1.common.setDatabaseSettings']
    const params = Array.isArray(args) ? args[0] : args
    if (params && typeof params === 'object') Object.assign(params, GRAPHIC_SETTINGS)
  }
}

/** Why a command is refused when it would hand out OFB (what the MCP's own tools refuse), or null. */
function ofbRefusal(req: Record<string, any>): string | null {
  if (req.command !== 'Execute' || !Array.isArray(req.task)) return null
  for (const task of req.task) {
    const refused = task && typeof task === 'object' ? ofbExportRefusal(task) : null
    if (refused) return refused
  }
  return null
}

/**
 * The sharing of one MCP session. Created with the session, before any engine
 * runs: an invite is good from then on, and the first guest that joins with it
 * starts the engine if nothing else has.
 */
export function createSessionHub(opts: HubOptions): SessionHub {
  const { client, queue, toHost } = opts
  const log = opts.log ?? (() => {})
  const hostId = randomUUID()
  const invites = new Map<string, Invite>()
  const guests = new Set<Guest>()
  const hostPresence = new Map<string, Record<string, any>>()
  /** Who asked for what: a guest's request, until its reply went out. */
  const askedBy = new WeakMap<object, Guest>()
  let closed = false

  const raw = (guest: Guest, frame: string | Buffer): void => {
    if (guest.ws.readyState === WebSocket.OPEN) guest.ws.send(frame, { binary: typeof frame !== 'string' })
  }
  const send = (guest: Guest, frame: Record<string, any>): void => raw(guest, JSON.stringify(frame))

  /** The complete graphic, as a server puts it on a GetTree Result. */
  const completeGraphic = () => ({ containers: client.engineContainers(), properties: { version: 11 } })

  /** One engine reply, to everyone it concerns, each in the form its connection asked for. */
  function deliver(req: Record<string, any>, res: EngineExecuteResult, origin: Guest | null): void {
    const read = READS.has(String(req.command))
    // A pull concerns only the one who asked; the host's own are its own.
    const recipients = read ? (origin && guests.has(origin) ? [origin] : []) : [...guests]
    if (!recipients.length) return
    const p = pieces(req, res)
    const head = { _from_: p.from, _transactionID_: p.tx }
    // Built once per form, whoever needs it.
    let patchFrames: string[] | null = null
    let graphicBinary: Buffer[] | null = null
    let graphicText: string[] | null = null
    for (const guest of recipients) {
      const cfg = guest.config
      const result: Record<string, any> = { ...p.result }
      if (read) {
        result.structure = p.structure
        if (cfg.sendGraphic_Kernel !== false) result.graphic = completeGraphic()
      } else if (streams(cfg)) {
        if (cfg.sendStructure !== false) {
          patchFrames ??= p.patches.map(ops => JSON.stringify({ command: 'StructurePatch', ...head, structurePatch: ops }))
          for (const frame of patchFrames) raw(guest, frame)
        }
        if (cfg.sendGraphic_Kernel !== false && p.packages.length) {
          if (cfg.sendGraphic_ImmediatelyBinary === true) {
            graphicBinary ??= p.packages.map(pkg => deflateRawSync(JSON.stringify({ command: 'Graphic', ...head, graphic: pkg })))
            for (const frame of graphicBinary) raw(guest, frame)
          } else {
            graphicText ??= p.packages.map(pkg => JSON.stringify({ command: 'Graphic', ...head, graphic: pkg }))
            for (const frame of graphicText) raw(guest, frame)
          }
        }
      } else if (cfg.sendGraphic_Kernel !== false && p.packages.length) {
        // Bundled: what the command changed rides on its Result. The structure
        // does not (it would cost a pull per command): GetTree returns it.
        result.graphic = { containers: p.packages.flatMap(pkg => pkg?.containers ?? []), properties: { version: 11 } }
      }
      if (cfg.sendMessages === false) delete result.messages
      send(guest, result)
    }
  }

  const unsubReply = client.onEngineReply((req, res, origin) => {
    if (closed || !guests.size) return
    const guest = origin === 'guest' ? askedBy.get(req) ?? null : null
    try {
      deliver(req as Record<string, any>, res, guest)
    } catch (err) {
      log(`share: could not deliver ${String(req.command)} (${(err as Error)?.message ?? err})`)
    }
  })

  // A new engine has an empty drawing: what the guests hold is of the old one.
  const unsubStart = client.onEngineStart(() => {
    if (!closed && guests.size) void resync()
  })

  /** Sends every guest the whole model, as the Result of a GetTree nobody asked: the clients replace what they hold. */
  async function resync(): Promise<void> {
    if (closed || !guests.size || client.transport !== 'wasm') return
    const req = { command: 'GetTree', commandVersion: 'v1', transactionID: `resync-${randomUUID()}` }
    try {
      const res = await client.relay(req)
      const p = pieces(req, res)
      const frame = JSON.stringify({ ...p.result, structure: p.structure, graphic: completeGraphic() })
      for (const guest of guests) raw(guest, frame)
    } catch (err) {
      log(`share: resync failed (${(err as Error)?.message ?? err})`)
    }
  }

  /** A guest's presence frame: kept for those who join later and relayed to everyone else, as a server does. */
  function presence(guest: Guest, frame: Record<string, any>, bytes: number): void {
    const channel = typeof frame.channel === 'string' ? frame.channel : ''
    const data = frame.data
    if (!channel || bytes > PRESENCE_MAX_BYTES || !data || typeof data !== 'object' || Array.isArray(data)) return
    if (HOST_CHANNELS.has(channel) || SERVER_CHANNELS.has(channel)) return
    guest.presence.set(channel, data)
    const out = { command: 'Presence', channel, peerId: guest.peerId, data }
    for (const other of guests) if (other !== guest) send(other, out)
    toHost(out)
  }

  /** A guest's command: answered here (emission config, what a guest may not do), or run on the engine. */
  async function command(guest: Guest, req: Record<string, any>): Promise<void> {
    const name = req.command
    if (name === 'GetEmissionConfig') return send(guest, { command: 'Result', _from_: name, _transactionID_: req.transactionID, result: { ...guest.config } })
    if (name === 'SetEmissionConfig') {
      const wanted = req.config && typeof req.config === 'object' ? (req.config as Record<string, unknown>) : {}
      for (const [key, value] of Object.entries(wanted)) {
        if (key in DEFAULT_EMISSION && typeof value === typeof DEFAULT_EMISSION[key]) guest.config[key] = value as boolean | number
      }
      return send(guest, { command: 'Result', _from_: name, _transactionID_: req.transactionID, result: { ...guest.config } })
    }
    if (name === 'CreateInvite' || name === 'RevokeInvite') return send(guest, errorResult(req, `${name}: only the host of a session can do that, and this connection joined it by invite.`))
    const refused = ofbRefusal(req)
    if (refused) return send(guest, errorResult(req, refused))
    keepGraphicSettings(req)
    askedBy.set(req, guest)
    const t0 = Date.now()
    let t1 = t0
    try {
      // The reply goes out through onEngineReply → deliver().
      if (READS.has(name)) await client.relay(req)
      else
        await queue(() => {
          t1 = Date.now()
          return client.relay(req)
        })
      if (process.env.CLASSCAD_SHARE_DEBUG) log(`share: ${name} waited ${t1 - t0} ms, ran ${Date.now() - t1} ms: ${JSON.stringify({ task: req.task, options: req.options }).slice(0, 700)}`)
    } catch (err) {
      send(guest, errorResult(req, (err as Error)?.message ?? String(err)))
    }
  }

  /** A guest is gone: the others and the host are told. */
  function leave(guest: Guest): void {
    if (!guests.delete(guest)) return
    const left = { command: 'Presence', channel: 'leave', peerId: guest.peerId, data: {} }
    for (const other of guests) send(other, left)
    toHost({ command: 'PeerLeft', peerId: guest.peerId, invite: guest.invite.invite, inviteName: guest.invite.name })
    toHost(left)
    log(`share: ${guest.invite.name || 'a guest'} left (${guests.size} docked)`)
  }

  /** Takes a guest in on the MCP's own engine: the handshake a server gives, then its commands and presence. */
  function serve(ws: WebSocket, invite: Invite, early: Early): void {
    const guest: Guest = { peerId: randomUUID(), ws, invite, config: { ...DEFAULT_EMISSION }, presence: new Map() }
    send(guest, { command: 'SessionJoined', role: invite.role, inviteName: invite.name })
    // The snapshot: what everyone already here last said, per channel.
    for (const [channel, data] of hostPresence) send(guest, { command: 'Presence', channel, peerId: hostId, data })
    for (const other of guests) for (const [channel, data] of other.presence) send(guest, { command: 'Presence', channel, peerId: other.peerId, data })
    guests.add(guest)
    toHost({ command: 'PeerJoined', peerId: guest.peerId, invite: invite.invite, inviteName: invite.name, role: invite.role })
    log(`share: ${invite.name || 'a guest'} joined (${invite.role}; ${guests.size} docked)`)
    const onMessage = (data: WebSocket.RawData, isBinary: boolean) => {
      if (isBinary || closed) return
      const text = data.toString()
      let req: Record<string, any>
      try {
        req = JSON.parse(text)
      } catch {
        return
      }
      if (!req || typeof req !== 'object' || typeof req.command !== 'string') return
      if (req.command === 'Presence') return presence(guest, req, Buffer.byteLength(text))
      void command(guest, req)
    }
    for (const m of early) onMessage(m.data, m.isBinary)
    ws.on('message', onMessage)
    // A guest that went away without a word (a closed laptop) must not stay docked.
    let alive = true
    ws.on('pong', () => (alive = true))
    const beat = setInterval(() => {
      if (!alive) return ws.terminate()
      alive = false
      ws.ping()
    }, HEARTBEAT_MS)
    beat.unref()
    const gone = () => {
      clearInterval(beat)
      leave(guest)
    }
    ws.on('close', gone)
    ws.on('error', gone)
  }

  // ── A session on a ClassCAD worker ──
  // The server speaks the protocol; a guest is piped through to it with an
  // invite of the server's own. What the MCP's tools refuse is refused here too.

  /** Guests that are piped through, with the invite they joined with. */
  const piped = new Map<WebSocket, Invite>()
  /** The server's invite for each of ours, minted on first use and again after a reconnect (a new server session). */
  const serverInvites = new Map<string, { generation: number; token: Promise<string> }>()
  function serverInvite(invite: Invite): Promise<string> {
    const known = serverInvites.get(invite.invite)
    if (known && known.generation === client.generation) return known.token
    const token = client
      .request<{ invite: string }>('CreateInvite', { role: invite.role, name: invite.name }, { track: false })
      .then(r => {
        if (!r.result?.invite) throw new Error(r.messages?.[0]?.message ?? 'the server minted no invite')
        return r.result.invite
      })
    serverInvites.set(invite.invite, { generation: client.generation, token })
    token.catch(() => serverInvites.delete(invite.invite))
    return token
  }

  /** Joins a guest to the server's session and passes the frames both ways. */
  async function pipe(ws: WebSocket, invite: Invite, early: Early): Promise<void> {
    // What the guest sends before the server is reached must not be lost.
    const buffer = (data: WebSocket.RawData, isBinary: boolean) => void early.push({ data, isBinary })
    ws.on('message', buffer)
    let token: string
    try {
      token = await serverInvite(invite)
    } catch (err) {
      log(`share: no invite from the ClassCAD server (${(err as Error)?.message ?? err})`)
      // An invited connection cannot invite: another app hosts this session.
      return ws.close(1008, 'this session is hosted elsewhere: join it with its own share link')
    }
    const base = client.url.split('?')[0].replace(/\/+$/, '')
    const upstream = new WebSocket(`${base}/?invite=${encodeURIComponent(token)}`)
    const forward = (data: WebSocket.RawData, isBinary: boolean) => {
      if (!isBinary) {
        let req: Record<string, any> | null = null
        try {
          req = JSON.parse(data.toString())
        } catch {
          /* not ours to judge */
        }
        const refused = req && typeof req === 'object' ? ofbRefusal(req) : null
        if (refused) return void ws.send(JSON.stringify(errorResult(req!, refused)))
      }
      if (upstream.readyState === WebSocket.OPEN) upstream.send(data, { binary: isBinary })
    }
    upstream.on('open', () => {
      ws.off('message', buffer)
      for (const m of early) forward(m.data, m.isBinary)
      ws.on('message', forward)
    })
    upstream.on('message', (data, isBinary) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(data, { binary: isBinary })
    })
    const end = () => {
      piped.delete(ws)
      if (upstream.readyState <= WebSocket.OPEN) upstream.close()
      if (ws.readyState <= WebSocket.OPEN) ws.close()
    }
    piped.set(ws, invite)
    upstream.on('close', end)
    upstream.on('error', end)
    ws.on('close', end)
    ws.on('error', end)
    log(`share: ${invite.name || 'a guest'} joined through the ClassCAD server (${invite.role})`)
  }

  /** Closes every guest, served here or piped. */
  const closeAll = (code: number, reason: string) => {
    for (const guest of [...guests]) {
      try {
        guest.ws.close(code, reason)
      } catch {
        /* already closing */
      }
      leave(guest)
    }
    for (const ws of [...piped.keys()]) {
      try {
        ws.close(code, reason)
      } catch {
        /* already closing */
      }
    }
  }

  return {
    hostId,
    createInvite: (role = 'edit', name = '') => {
      const invite: Invite = { invite: randomUUID(), role, name }
      invites.set(invite.invite, invite)
      return invite
    },
    revokeInvite: token => {
      const known = invites.delete(token)
      let kicked = 0
      for (const guest of [...guests]) {
        if (guest.invite.invite !== token) continue
        guest.ws.close(1008, 'invite revoked')
        leave(guest)
        kicked++
      }
      for (const [ws, invite] of [...piped]) {
        if (invite.invite !== token) continue
        ws.close(1008, 'invite revoked')
        kicked++
      }
      return { invite: token, revoked: known, kicked }
    },
    invite: token => invites.get(token),
    join: (ws, token) => {
      const invite = invites.get(token)
      if (closed || !invite) return ws.close(1008, 'unknown invite')
      // What the guest sends before the engine is up must not be lost.
      const early: Early = []
      const buffer = (data: WebSocket.RawData, isBinary: boolean) => void early.push({ data, isBinary })
      ws.on('message', buffer)
      // Which engine this session runs on is decided by its first use: that is now.
      client.open().then(
        () => {
          ws.off('message', buffer)
          if (ws.readyState !== WebSocket.OPEN) return
          if (client.transport === 'wasm') serve(ws, invite, early)
          else void pipe(ws, invite, early)
        },
        err => {
          log(`share: the engine did not start for a guest (${(err as Error)?.message ?? err})`)
          ws.close(1011, 'the engine did not start')
        },
      )
    },
    sendPresence: (channel, data) => {
      if (SERVER_CHANNELS.has(channel)) return
      hostPresence.set(channel, data)
      const out = { command: 'Presence', channel, peerId: hostId, data }
      for (const guest of guests) send(guest, out)
    },
    resync,
    kick: reason => closeAll(1012, reason),
    get guests() {
      return guests.size + piped.size
    },
    close: () => {
      if (closed) return
      closeAll(1001, 'the session is over')
      closed = true
      unsubReply()
      unsubStart()
      invites.clear()
    },
  }
}
