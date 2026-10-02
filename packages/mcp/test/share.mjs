// Session sharing contract — runs on every build (postbuild). No engine: the
// hub is driven with canned replies in the dialect of the local engine.
//   1. pieces(): the engine's reply becomes what a server's frames are made of
//   2. the hub serves a guest like a ClassCAD server does: SessionJoined, its
//      own emission config, streamed or bundled frames, pulls with the complete
//      graphic, the host's commands fanned out, invites refused to guests
//   3. presence: fan-out with the sender's id, the snapshot for late joiners,
//      reserved channels and oversized frames dropped, 'leave' on disconnect
//   4. what the MCP's tools refuse (OFB) a guest is refused too, and the graphic
//      settings the MCP's renders need survive a guest's own
//   5. the listener: an unknown invite fails the handshake; a page that hosts
//      its own session is joined through it (offer, knock, meet, pass bytes),
//      and its guests go with it
import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { inflateRawSync } from 'node:zlib'
import { request } from 'node:http'
import WebSocket from 'ws'
import { fakeAuth } from './fake-auth.mjs'

// The listener asks whether the machine is signed in: set that up before it is loaded.
Object.assign(process.env, (await fakeAuth()).env)
const { createSessionHub, pieces } = await import('../dist/share/hub.js')
const { listen, offerInvite, joinedHere, waitForPage, dockedApps, offeringPages } = await import('../dist/share/server.js')

const sleep = ms => new Promise(r => setTimeout(r, ms))
const { port } = await listen()
const SESSION = `ws://127.0.0.1:${port}/session`

/** What buerli's WSClient asks for on connect: everything, streamed. */
const STREAMING = { sendStructure: true, sendStructure_Patch: true, sendStructure_Immediately: true, sendGraphic_Kernel: true, sendGraphic_Immediately: true, sendGraphic_ImmediatelyBinary: true, sendMessages: true }

/** Replies as the local engine gives them. */
const engineReply = req => {
  if (req.command === 'GetTree') return { messages: [{ command: 'Result', from: 'GetTree', result: { root: 1, tree: { 1: { id: 1, class: 'AllObjects' }, 5: { id: 5, class: 'CC_Solid' } } }, transactionID: req.transactionID }], binaryMessages: [] }
  const task = req.task?.[0] ?? {}
  if ('v1.fails' in task)
    return { messages: [{ command: 'ErrorMessage', attributes: { errorState: 2, errorCode: 1006, errorMessage: 'no such part' } }, { command: 'Result', from: 'Execute', result: { result: null, maxLevel: 51, messages: [{ level: 51, levelStr: 'ERROR', code: 1006, message: 'no such part' }] } }], binaryMessages: [] }
  return {
    messages: [{ command: 'Patch', ops: [{ op: 'add', path: '/tree/5', value: { id: 5 } }] }, { command: 'Result', from: 'Execute', result: { result: 42 }, transactionID: req.transactionID }],
    binaryMessages: [{ containers: [{ id: 7, owner: 5, meshes: [] }], properties: { version: 11 } }],
  }
}

/** The part of the engine client a hub uses, with canned replies. */
function fakeClient() {
  const replies = new Set()
  const starts = new Set()
  const containers = new Map()
  const run = (req, origin) => {
    const res = engineReply(req)
    for (const pkg of res.binaryMessages) for (const c of pkg.containers) containers.set(c.id, c)
    for (const hear of replies) hear(req, res, origin)
    return res
  }
  return {
    transport: 'wasm',
    generation: 0,
    url: 'ws://127.0.0.1:1/',
    shareToken: null,
    relayed: [],
    open: async () => {},
    async relay(req) {
      this.relayed.push(req)
      return run(req, 'guest')
    },
    /** A command of the host itself. */
    host: req => run(req, 'host'),
    restart: () => { for (const hear of starts) hear() },
    onEngineReply: l => (replies.add(l), () => replies.delete(l)),
    onEngineStart: l => (starts.add(l), () => starts.delete(l)),
    engineContainers: () => [...containers.values()],
    request: async () => { throw new Error('not a server') },
  }
}

function session() {
  const client = fakeClient()
  const toHost = []
  const hub = createSessionHub({ client, queue: work => work(), toHost: f => toHost.push(f) })
  const invite = hub.createInvite('edit', 'tester')
  const unoffer = offerInvite(invite.invite, hub)
  return { client, hub, invite, toHost, end: () => (unoffer(), hub.close()) }
}

/** A guest: everything it was sent, and requests answered by their Result. */
function guest(url) {
  const ws = new WebSocket(url)
  const frames = []
  const waiters = new Map()
  let n = 0
  ws.on('message', (data, isBinary) => {
    const frame = JSON.parse(isBinary ? inflateRawSync(data).toString() : data.toString())
    frames.push({ ...frame, binary: isBinary })
    if (frame.command === 'Result' && waiters.has(frame._transactionID_)) {
      waiters.get(frame._transactionID_)(frame)
      waiters.delete(frame._transactionID_)
    }
  })
  const opened = new Promise((resolve, reject) => { ws.once('open', resolve); ws.once('error', reject); ws.once('unexpected-response', (_req, res) => reject(new Error(`HTTP ${res.statusCode}`))) })
  const closed = new Promise(resolve => ws.once('close', code => resolve(code)))
  const send = cmd => new Promise(resolve => {
    const transactionID = `t${++n}`
    waiters.set(transactionID, resolve)
    ws.send(JSON.stringify({ commandVersion: 'v1', transactionID, ...cmd }))
  })
  return { ws, frames, opened, closed, send, presence: (channel, data) => ws.send(JSON.stringify({ command: 'Presence', channel, data })), of: command => frames.filter(f => f.command === command) }
}

test('pieces: an engine reply in what a server\'s frames are made of', () => {
  const ok = pieces({ command: 'Execute', transactionID: 'x' }, engineReply({ command: 'Execute', transactionID: 'x', task: [{ 'v1.part.box': [{}] }] }))
  assert.deepEqual(ok.patches, [[{ op: 'add', path: '/tree/5', value: { id: 5 } }]])
  assert.equal(ok.packages.length, 1)
  assert.deepEqual(ok.result, { command: 'Result', _from_: 'Execute', _transactionID_: 'x', result: 42 }, 'the value is lifted out of the nesting, with the names a server uses')

  const failed = pieces({ command: 'Execute', transactionID: 'y' }, engineReply({ command: 'Execute', task: [{ 'v1.fails': [] }] }))
  assert.equal(failed.result.maxLevel, 51)
  assert.equal(failed.result.result, null)
  assert.equal(failed.result.messages[0].message, 'no such part')

  const tree = pieces({ command: 'GetTree', transactionID: 'z' }, engineReply({ command: 'GetTree' }))
  assert.ok(tree.structure.tree[5], 'a pull\'s structure, wherever the engine put it')
  assert.equal('result' in tree.result, false)

  const silent = pieces({ command: 'Execute', transactionID: 'q' }, { messages: [{ command: 'ErrorMessage', attributes: { errorState: 3, errorCode: 9, errorMessage: 'boom' } }], binaryMessages: [] })
  assert.equal(silent.result.maxLevel, 51, 'no Result at all is an error, never an empty success')
  assert.match(silent.result.messages[0].message, /boom/)
})

test('hub: a guest is served like a ClassCAD server serves it', async () => {
  const s = session()
  const g = guest(`${SESSION}/?invite=${s.invite.invite}`)
  try {
    await g.opened
    // Sent at once, before the hub is ready for it: must not be lost.
    const config = await g.send({ command: 'SetEmissionConfig', config: STREAMING })
    assert.equal(g.frames[0].command, 'SessionJoined', 'the first frame')
    assert.deepEqual({ role: g.frames[0].role, inviteName: g.frames[0].inviteName }, { role: 'edit', inviteName: 'tester' })
    assert.equal(config.result.sendStructure_Patch, true, 'the connection\'s own config, effective flags back')
    assert.equal(config.result.sendGraphic_Compressed, false, 'flags it did not name keep a server\'s defaults')
    assert.equal(s.client.relayed.length, 0, 'the engine never hears of it')
    assert.deepEqual(s.toHost.map(f => f.command), ['PeerJoined'], 'the host is told who joined')

    const tree = await g.send({ command: 'GetTree' })
    assert.ok(tree.structure.tree[1], 'a pull returns the structure')
    assert.deepEqual(tree.graphic, { containers: [], properties: { version: 11 } }, '… and the complete graphic')

    g.frames.length = 0
    const done = await g.send({ command: 'Execute', task: [{ 'v1.part.box': [{ id: 4 }] }], options: { undoable: true } })
    assert.equal(done.result, 42)
    assert.deepEqual(g.frames.map(f => f.command), ['StructurePatch', 'Graphic', 'Result'], 'streamed: patch, graphic, then the Result')
    assert.equal(g.of('StructurePatch')[0].structurePatch[0].path, '/tree/5')
    assert.equal(g.of('Graphic')[0].binary, true, 'graphics as raw-deflated binary frames, as it asked')
    assert.equal(g.of('Graphic')[0].graphic.containers[0].id, 7)
    assert.ok(g.frames.every(f => f._transactionID_ === done._transactionID_ && f._from_ === 'Execute'))

    // The host's own commands reach the guest too; its pulls do not.
    g.frames.length = 0
    s.client.host({ command: 'Execute', transactionID: 'host-1', task: [{ 'v1.part.cylinder': [{}] }] })
    s.client.host({ command: 'GetTree', transactionID: 'host-2' })
    await sleep(50)
    assert.deepEqual(g.frames.map(f => `${f.command}:${f._transactionID_}`), ['StructurePatch:host-1', 'Graphic:host-1', 'Result:host-1'])

    const pull = await g.send({ command: 'GetTree' })
    assert.equal(pull.graphic.containers.length, 1, 'the complete graphic: every container so far')

    const failed = await g.send({ command: 'Execute', task: [{ 'v1.fails': [] }] })
    assert.equal(failed.maxLevel, 51)
    assert.equal(failed.messages[0].code, 1006)

    const invite = await g.send({ command: 'CreateInvite', role: 'edit' })
    assert.equal(invite.maxLevel, 51, 'only the host invites')
    assert.equal('result' in invite, false)

    // A new engine has an empty drawing: the guests are sent the model anew.
    g.frames.length = 0
    s.client.restart()
    await sleep(50)
    assert.equal(g.frames.length, 1)
    assert.ok(g.frames[0].command === 'Result' && g.frames[0]._from_ === 'GetTree' && g.frames[0].structure && g.frames[0].graphic, 'a pull nobody asked for: structure and graphic')
  } finally {
    g.ws.close()
    s.end()
  }
})

test('hub: a connection that did not ask for streaming gets its results bundled', async () => {
  const s = session()
  const g = guest(`${SESSION}/?invite=${s.invite.invite}`)
  try {
    await g.opened
    const done = await g.send({ command: 'Execute', task: [{ 'v1.part.box': [{}] }] })
    assert.equal(done.result, 42)
    assert.deepEqual(g.frames.map(f => f.command), ['SessionJoined', 'Result'], 'no frames of their own')
    assert.equal(done.graphic.containers[0].id, 7, 'what the command changed rides on the Result')

    // Around a script an agent switches its emission off: Results only.
    await g.send({ command: 'SetEmissionConfig', config: { sendStructure: false, sendGraphic_Kernel: false } })
    const quiet = await g.send({ command: 'Execute', task: [{ 'v1.part.box': [{}] }] })
    assert.equal('graphic' in quiet, false)
    const pull = await g.send({ command: 'GetTree' })
    assert.ok(pull.structure, 'a pull returns the structure whatever the flags say')
    assert.equal('graphic' in pull, false)
    const flags = await g.send({ command: 'GetEmissionConfig' })
    assert.equal(flags.result.sendGraphic_Kernel, false)
  } finally {
    g.ws.close()
    s.end()
  }
})

test('hub: presence goes to the others with the sender\'s id, and to those who join later', async () => {
  const s = session()
  const a = guest(`${SESSION}/?invite=${s.invite.invite}`)
  await a.opened
  await a.send({ command: 'GetEmissionConfig' })
  s.hub.sendPresence('client', { app: 'classcad-mcp', kind: 'agent' })
  a.presence('selection', { items: [{ kind: 'face', objectId: 5, graphicId: 9 }], total: 1 })
  a.presence('config', { saveFormats: ['OFB'] }) // the host's channel
  a.presence('leave', {}) // the server's
  a.presence('big', { blob: 'x'.repeat(9000) }) // more than a server relays
  await a.send({ command: 'GetEmissionConfig' })
  const b = guest(`${SESSION}/?invite=${s.invite.invite}`)
  try {
    await b.opened
    await b.send({ command: 'GetEmissionConfig' })
    const peerA = s.toHost.find(f => f.command === 'PeerJoined').peerId
    assert.deepEqual(b.of('Presence').map(f => [f.channel, f.peerId === s.hub.hostId ? 'host' : f.peerId === peerA ? 'a' : '?']), [['client', 'host'], ['selection', 'a']], 'the snapshot: the last frame per channel of everyone here, and nothing that was dropped')
    assert.deepEqual(s.toHost.filter(f => f.command === 'Presence').map(f => f.channel), ['selection'], 'the host hears what guests publish, reserved channels and oversized frames aside')
    assert.equal(a.of('Presence').filter(f => f.channel === 'client').length, 1, 'the host\'s presence reaches a guest once: no echo of its own')

    b.presence('view', { zoom: 2 })
    s.hub.sendPresence('select', { id: 'r1', items: [{ graphicId: 9 }] })
    await a.send({ command: 'GetEmissionConfig' })
    await b.send({ command: 'GetEmissionConfig' })
    assert.equal(a.of('Presence').some(f => f.channel === 'view' && f.data.zoom === 2), true, 'guest to guest')
    assert.equal(b.of('Presence').some(f => f.channel === 'view'), false, 'never back to the sender')
    assert.equal(a.of('Presence').filter(f => f.channel === 'select' && f.peerId === s.hub.hostId).length, 1, 'host to guests')

    a.ws.close()
    await a.closed
    await sleep(50)
    assert.equal(b.of('Presence').some(f => f.channel === 'leave' && f.peerId === peerA), true, 'the others are told who left')
    assert.deepEqual(s.toHost.slice(-2).map(f => f.command === 'Presence' ? f.channel : f.command), ['PeerLeft', 'leave'])
    assert.equal(s.hub.guests, 1)
    assert.equal(dockedApps(), 1)
  } finally {
    a.ws.close()
    b.ws.close()
    s.end()
  }
})

test('hub: what the MCP\'s tools refuse, a guest is refused too', async () => {
  const s = session()
  const g = guest(`${SESSION}/?invite=${s.invite.invite}`)
  try {
    await g.opened
    const ofb = await g.send({ command: 'Execute', task: [{ 'v1.common.save': [{ format: 'OFB', encoding: 'base64' }] }] })
    assert.equal(ofb.maxLevel, 51)
    assert.match(ofb.messages[0].message, /OFB export is not available/)
    const node = await g.send({ command: 'Execute', task: [{ 'v1.assembly.exportNode': [{ id: 4, encoding: 'base64' }] }] })
    assert.equal(node.maxLevel, 51, 'exportNode writes OFB unless told otherwise')
    assert.equal(s.client.relayed.length, 0, 'neither reached the engine')
    const stp = await g.send({ command: 'Execute', task: [{ 'v1.common.save': [{ format: 'STP', encoding: 'base64' }] }] })
    assert.equal(stp.result, 42, 'STEP passes')

    // The app's own graphic settings must not switch off what the MCP's renders are built on.
    await g.send({ command: 'Execute', task: [{ 'v1.common.setDatabaseSettings': [{ isGraphicEnabled: true, isCCGraphicEnabled: false, isSketchGraphicEnabled: false, doCurveTessellation: false, chordHeightTol: 0.1 }] }] })
    const settings = s.client.relayed.at(-1).task[0]['v1.common.setDatabaseSettings'][0]
    assert.deepEqual(settings, { isGraphicEnabled: true, isCCGraphicEnabled: true, isSketchGraphicEnabled: true, doCurveTessellation: true, chordHeightTol: 0.1 })
  } finally {
    g.ws.close()
    s.end()
  }
})

test('listener: no invite, no session — and a revoked invite cuts its guests off', async () => {
  await assert.rejects(guest(`${SESSION}/?invite=nobody-has-this`).opened, /HTTP 403/, 'an unknown invite fails the handshake, like on a server')
  await assert.rejects(guest(`${SESSION}/`).opened, /HTTP 403/)
  await assert.rejects(guest(`ws://127.0.0.1:${port}/elsewhere?invite=x`).opened, /HTTP 404/)
  const page = await fetch(`http://127.0.0.1:${port}/`)
  assert.equal(page.status, 404, 'the app without an invite is not served')
  // fetch() does not let a caller name another host: a plain request does (a rebound DNS name looks like this).
  const foreign = await new Promise((resolve, reject) => {
    const req = request({ host: '127.0.0.1', port, path: '/?invite=x', headers: { host: 'evil.example' } }, res => { res.resume(); resolve(res.statusCode) })
    req.on('error', reject)
    req.end()
  })
  assert.equal(foreign, 403, 'only requests that name this listener')

  const s = session()
  const g = guest(`${SESSION}/?invite=${s.invite.invite}`)
  await g.opened
  await g.send({ command: 'GetEmissionConfig' })
  assert.deepEqual(s.hub.revokeInvite(s.invite.invite), { invite: s.invite.invite, revoked: true, kicked: 1 })
  assert.equal(await g.closed, 1008)
  s.end()
  await assert.rejects(guest(`${SESSION}/?invite=${s.invite.invite}`).opened, /HTTP 403/, 'the session is over: so is its invite')
})

test('listener: a page that hosts its own session is joined through it', async () => {
  const token = 'page-invite-0123456789'
  assert.equal(joinedHere(token), false)
  const offered = waitForPage(token, 3000)
  // The page: a standing connection that offers the invite …
  const control = new WebSocket(`${SESSION}/?host=${token}`)
  const knocks = []
  control.on('message', d => knocks.push(JSON.parse(d.toString())))
  await new Promise((resolve, reject) => { control.once('open', resolve); control.once('error', reject) })
  assert.equal(await offered, true, 'whoever waited for the page is told')
  assert.equal(joinedHere(token), true)
  assert.equal(offeringPages(), 1)
  await assert.rejects(guest(`${SESSION}/?host=${token}`).opened, /HTTP 409/, 'an invite is offered once')

  // … a guest joins with it and speaks at once …
  const g = new WebSocket(`${SESSION}/?invite=${token}`)
  const got = []
  g.on('message', (d, isBinary) => got.push(isBinary ? d : d.toString()))
  await new Promise((resolve, reject) => { g.once('open', resolve); g.once('error', reject) })
  g.send('{"command":"SetEmissionConfig","transactionID":"t1"}')
  for (let i = 0; i < 40 && !knocks.length; i++) await sleep(25)
  assert.equal(knocks.length, 1)
  assert.equal(knocks[0].relay, 'guest', 'the page is told that somebody joined')

  // … the page meets it on a connection of its own, and from there on bytes pass both ways.
  const link = new WebSocket(`${SESSION}/?host=${token}&guest=${knocks[0].guest}`)
  const heard = []
  link.on('message', (d, isBinary) => heard.push(isBinary ? d : d.toString()))
  await new Promise((resolve, reject) => { link.once('open', resolve); link.once('error', reject) })
  for (let i = 0; i < 40 && !heard.length; i++) await sleep(25)
  assert.deepEqual(heard, ['{"command":"SetEmissionConfig","transactionID":"t1"}'], 'what the guest said before the page was there is not lost')
  link.send('{"command":"SessionJoined","role":"edit","inviteName":""}')
  link.send(Buffer.from([1, 2, 3]), { binary: true })
  for (let i = 0; i < 40 && got.length < 2; i++) await sleep(25)
  assert.equal(got[0], '{"command":"SessionJoined","role":"edit","inviteName":""}')
  assert.deepEqual([...got[1]], [1, 2, 3], 'binary frames pass as they are')
  await assert.rejects(guest(`${SESSION}/?host=${token}&guest=${knocks[0].guest}`).opened, /HTTP 404/, 'a guest is met once')

  // The page goes: so does its session, for everyone in it.
  const closed = new Promise(resolve => g.once('close', resolve))
  control.close()
  await closed
  await sleep(50)
  assert.equal(joinedHere(token), false)
  assert.equal(offeringPages(), 0)
  link.close()
})
