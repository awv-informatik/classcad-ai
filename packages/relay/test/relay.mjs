// The share relay's contract — against the Worker itself, as `wrangler dev`
// runs it on this machine (no Cloudflare account, no network).
//   1. the app is served, with the headers the MCP's own listener gives it
//   2. who may offer a session: a signed-in machine (a Firebase ID token that
//      holds), and nobody else; no invite, no session
//   3. host and guests are introduced like on the MCP's listener: offer,
//      knock, meet, frames both ways; each side hears why the other went
//   4. a host that comes back takes over its own offer, not somebody else's;
//      the host gone, the session is over for everyone
//   5. end to end with the MCP: a session offered here (share/relay.ts) serves
//      a guest like one on its own listener, and takes its invite back
import { test, before, after } from 'node:test'
import { strict as assert } from 'node:assert'
import { spawn, execFileSync } from 'node:child_process'
import { createSign, generateKeyPairSync } from 'node:crypto'
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { createServer as createTcpServer } from 'node:net'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import WebSocket from 'ws'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
// wrangler runs on Node 22 and later: on an older Node the Worker cannot be started here (CI runs this on Node 24 too)
const OLD_NODE = Number(process.versions.node.split('.')[0]) < 22 && `wrangler needs Node 22 or later (this is ${process.version})`
const sleep = ms => new Promise(r => setTimeout(r, ms))
const until = async (done, ms = 3000) => {
  for (let waited = 0; waited < ms && !done(); waited += 25) await sleep(25)
  return done()
}

// ── Sign-ins: tokens like Firebase's, signed with a key of this test's own ──
const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
const stranger = generateKeyPairSync('rsa', { modulusLength: 2048 })
const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url')
const now = () => Math.floor(Date.now() / 1000)
function idToken(claims = {}, { key = privateKey, alg = 'RS256' } = {}) {
  const body = `${b64({ alg, kid: 'test-key', typ: 'JWT' })}.${b64({ aud: 'buerli', iss: 'https://securetoken.google.com/buerli', sub: 'uid-test', iat: now(), exp: now() + 3600, ...claims })}`
  return `${body}.${alg === 'none' ? '' : createSign('RSA-SHA256').update(body).sign(key).toString('base64url')}`
}

/** Stands in for Google (the keys) and for Firebase's token endpoint (what the MCP exchanges its sign-in at). */
const google = createServer((req, res) => {
  res.setHeader('content-type', 'application/json')
  if (req.url.startsWith('/jwks')) {
    res.setHeader('cache-control', 'public, max-age=3600')
    return res.end(JSON.stringify({ keys: [{ ...publicKey.export({ format: 'jwk' }), kid: 'test-key', alg: 'RS256', use: 'sig' }] }))
  }
  req.resume()
  req.on('end', () => res.end(JSON.stringify({ id_token: idToken(), refresh_token: 'good', expires_in: '3600', user_id: 'uid-test' })))
})

const freePort = () => new Promise(resolve => {
  const s = createTcpServer().listen(0, '127.0.0.1', () => {
    const { port } = s.address()
    s.close(() => resolve(port))
  })
})

let wrangler
let RELAY
let SESSION

before(async () => {
  if (OLD_NODE) return
  await new Promise(r => google.listen(0, '127.0.0.1', r))
  const googleUrl = `http://127.0.0.1:${google.address().port}`
  // A stand-in for the app: what is served matters here, not what it does.
  const assets = join(root, '.wrangler', 'test-public')
  execFileSync(process.execPath, [join(root, 'scripts', 'assets.mjs')], { env: { ...process.env, APP_DIR: join(root, 'test', 'app'), OUT_DIR: assets }, stdio: 'ignore' })
  const port = await freePort()
  RELAY = `http://127.0.0.1:${port}`
  SESSION = `ws://127.0.0.1:${port}/session`
  wrangler = spawn('npx', ['wrangler', 'dev', '--ip', '127.0.0.1', '--port', String(port), '--inspector-port', String(await freePort()), '--assets', assets, '--var', `FIREBASE_JWKS_URL:${googleUrl}/jwks`], {
    cwd: root,
    env: { ...process.env, CI: '1', WRANGLER_SEND_METRICS: 'false', NO_COLOR: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
  })
  let output = ''
  for (const stream of [wrangler.stdout, wrangler.stderr]) stream.on('data', d => (output += d))
  const up = await until(() => /Ready on/.test(output) || wrangler.exitCode !== null, 90_000)
  assert.ok(up && wrangler.exitCode === null, `wrangler dev did not come up:\n${output}`)

  // The MCP, for the last test: signed in at the stand-in above.
  const file = join(mkdtempSync(join(tmpdir(), 'classcad-relay-')), 'auth.json')
  writeFileSync(file, JSON.stringify({ uid: 'uid-test', email: 'test@example.com', name: 'Test', refreshToken: 'good', project: 'buerli', verifiedAt: Date.now() }))
  Object.assign(process.env, { CLASSCAD_AUTH_TOKEN_URL: `${googleUrl}/token`, CLASSCAD_AUTH_FILE: file, CLASSCAD_AUTH_URL: 'https://classcad.test/connect', CLASSCAD_AUTH_NO_BROWSER: '1', CLASSCAD_VIEWER_NO_BROWSER: '1', CLASSCAD_VIEWER_PORT: '0' })
})

after(async () => {
  if (OLD_NODE) return
  google.close()
  google.closeAllConnections?.()
  if (wrangler && wrangler.exitCode === null) {
    const gone = new Promise(r => wrangler.once('exit', r))
    wrangler.kill('SIGTERM')
    await Promise.race([gone, sleep(5000).then(() => wrangler.kill('SIGKILL'))])
  }
})

/** A WebSocket to the relay: what it was sent, whether the handshake held, and how it ended. */
function socket(url, headers = {}) {
  const ws = new WebSocket(url, { headers })
  const got = []
  ws.on('message', (data, isBinary) => got.push(isBinary ? data : data.toString()))
  const opened = new Promise((resolve, reject) => {
    ws.once('open', resolve)
    ws.once('error', reject)
    ws.once('unexpected-response', (_req, res) => (res.resume(), reject(new Error(`HTTP ${res.statusCode}`))))
  })
  opened.catch(() => {})
  const closed = new Promise(resolve => ws.once('close', (code, reason) => resolve({ code, reason: reason.toString() })))
  return { ws, got, opened, closed, json: () => got.filter(m => typeof m === 'string').map(m => JSON.parse(m)) }
}
const asHost = (token, account = {}) => socket(`${SESSION}/?host=${token}`, { authorization: `Bearer ${idToken(account)}` })
// (Under `wrangler dev`, a connection that never said anything takes ten seconds to end when the relay closes it. Guests
// and the connections they are met on always speak first, so the tests let theirs do the same and stay quick.)
const invite = name => `${name}-0123456789abcdef`

test('the app is served, with the headers the MCP\'s listener gives it', { skip: OLD_NODE }, async () => {
  const page = await fetch(`${RELAY}/?invite=${invite('page')}`)
  assert.equal(page.status, 200)
  assert.match(page.headers.get('content-type'), /text\/html/)
  assert.match(await page.text(), /stand-in for the app/)
  assert.equal(page.headers.get('cache-control'), 'no-store')
  assert.equal(page.headers.get('referrer-policy'), 'no-referrer', 'the link carries the invite: it is never sent on')
  assert.match(page.headers.get('content-security-policy'), /connect-src 'self' data: blob:;/)
  const code = await fetch(`${RELAY}/assets/app-0000.js`)
  assert.equal(code.status, 200)
  assert.match(code.headers.get('cache-control'), /immutable/)
  assert.equal(code.headers.get('x-content-type-options'), 'nosniff')
  assert.equal((await fetch(`${RELAY}/nothing-here`)).status, 404)
  assert.equal((await fetch(`${RELAY}/session/?invite=${invite('page')}`)).status, 426, 'a session is not a page')
})

test('a session is offered by a signed-in machine, and by nobody else', { skip: OLD_NODE }, async () => {
  const t = invite('auth')
  await assert.rejects(socket(`${SESSION}/?host=${t}`).opened, /HTTP 401/, 'no sign-in')
  await assert.rejects(socket(`${SESSION}/?host=${t}`, { authorization: 'Bearer not.a.token' }).opened, /HTTP 401/)
  await assert.rejects(asHost(t, { aud: 'someone-else' }).opened, /HTTP 401/, 'an account of another project')
  await assert.rejects(asHost(t, { iss: 'https://securetoken.google.com/someone-else' }).opened, /HTTP 401/)
  await assert.rejects(asHost(t, { exp: now() - 600 }).opened, /HTTP 401/, 'a sign-in that ran out')
  await assert.rejects(socket(`${SESSION}/?host=${t}`, { authorization: `Bearer ${idToken({}, { key: stranger.privateKey })}` }).opened, /HTTP 401/, 'signed by somebody else')
  await assert.rejects(socket(`${SESSION}/?host=${t}`, { authorization: `Bearer ${idToken({}, { alg: 'none' })}` }).opened, /HTTP 401/, 'not signed at all')
  // No invite, no session: the handshake just fails, like on a server.
  await assert.rejects(socket(`${SESSION}/?invite=${t}`).opened, /HTTP 403/, 'an invite nobody offers')
  await assert.rejects(socket(`${SESSION}/`).opened, /HTTP 403/)
  await assert.rejects(socket(`${SESSION}/?invite=short`).opened, /HTTP 403/)
  await assert.rejects(socket(`ws://${new URL(RELAY).host}/elsewhere?invite=${t}`).opened, /HTTP 404/)

  const host = asHost(t)
  await host.opened
  host.ws.close()
  await host.closed
})

test('host and guest are introduced, and each hears why the other went', { skip: OLD_NODE }, async () => {
  const t = invite('meet')
  const host = asHost(t)
  await host.opened

  // A guest joins with the invite and speaks at once …
  const g = socket(`${SESSION}/?invite=${t}`)
  await g.opened
  g.ws.send('{"command":"SetEmissionConfig","transactionID":"t1"}')
  assert.ok(await until(() => host.got.length === 1))
  const [knock] = host.json()
  assert.equal(knock.relay, 'guest', 'the host is told that somebody joined')

  // … the host meets it on a connection of its own, and from there on frames pass both ways.
  const link = socket(`${SESSION}/?host=${t}&guest=${knock.guest}`)
  await link.opened
  assert.ok(await until(() => link.got.length === 1))
  assert.deepEqual(link.got, ['{"command":"SetEmissionConfig","transactionID":"t1"}'], 'what the guest said before the host was there is not lost')
  link.ws.send('{"command":"SessionJoined","role":"edit","inviteName":"guest"}')
  link.ws.send(Buffer.from([1, 2, 3]), { binary: true })
  assert.ok(await until(() => g.got.length === 2))
  assert.equal(g.got[0], '{"command":"SessionJoined","role":"edit","inviteName":"guest"}')
  assert.deepEqual([...g.got[1]], [1, 2, 3], 'binary frames pass as they are')
  g.ws.send('{"command":"Execute","transactionID":"t2"}')
  assert.ok(await until(() => link.got.length === 2))
  await assert.rejects(socket(`${SESSION}/?host=${t}&guest=${knock.guest}`).opened, /HTTP 404/, 'a guest is met once')
  await assert.rejects(socket(`${SESSION}/?host=${t}&guest=nobody`).opened, /HTTP 404/)

  // The host takes the invite back from this guest: the guest hears why.
  link.ws.close(1008, 'invite revoked')
  assert.deepEqual(await g.closed, { code: 1008, reason: 'invite revoked' })

  // A guest that leaves takes its meeting along.
  const g2 = socket(`${SESSION}/?invite=${t}`)
  await g2.opened
  assert.ok(await until(() => host.got.length === 2))
  const link2 = socket(`${SESSION}/?host=${t}&guest=${host.json()[1].guest}`)
  await link2.opened
  link2.ws.send('{"command":"SessionJoined","role":"edit","inviteName":"guest"}')
  assert.ok(await until(() => g2.got.length === 1))
  g2.ws.close(1000)
  assert.equal((await link2.closed).code, 1000)

  host.ws.close()
  await host.closed
})

test('a host that comes back takes over its own offer; the host gone, the session is over', { skip: OLD_NODE }, async () => {
  const t = invite('again')
  const host = asHost(t)
  await host.opened
  const g = socket(`${SESSION}/?invite=${t}`)
  await g.opened
  assert.ok(await until(() => host.got.length === 1))
  const link = socket(`${SESSION}/?host=${t}&guest=${host.json()[0].guest}`)
  await link.opened
  g.ws.send('hello')
  assert.ok(await until(() => link.got.includes('hello')))

  await assert.rejects(asHost(t, { sub: 'uid-other' }).opened, /HTTP 409/, 'an invite is offered once: another account does not get it')

  // The same account, on another connection (the old one may be dead without anybody knowing): its guests stay.
  host.ws.send('{}')
  const back = asHost(t)
  await back.opened
  assert.equal((await host.closed).code, 1012, 'the connection it replaced is ended')
  link.ws.send('still here')
  assert.ok(await until(() => g.got.includes('still here')), 'a meeting outlives the connection that announced it')
  const g2 = socket(`${SESSION}/?invite=${t}`)
  await g2.opened
  g2.ws.send('hello')
  assert.ok(await until(() => back.got.length === 1), 'new guests are announced on the new connection')

  // The host goes: so does its session, for everyone in it.
  back.ws.close()
  assert.deepEqual(await g.closed, { code: 1001, reason: 'the session is over' })
  assert.equal((await g2.closed).code, 1001)
  assert.equal((await link.closed).code, 1001)
  await assert.rejects(socket(`${SESSION}/?invite=${t}`).opened, /HTTP 403/, 'the invite went with it')
})

const mcp = join(root, '..', 'mcp', 'dist', 'share')
test('end to end: a session the MCP offers here serves a guest like its own listener does', { skip: OLD_NODE || (!existsSync(join(mcp, 'relay.js')) && '@classcad/mcp is not built') }, async t => {
  const { createSessionHub } = await import(join(mcp, 'hub.js'))
  const { offerOnRelay } = await import(join(mcp, 'relay.js'))

  // The part of the engine client a hub uses, with canned replies in the local engine's dialect.
  const replies = new Set()
  const client = {
    transport: 'wasm',
    generation: 0,
    url: 'ws://127.0.0.1:1/',
    shareToken: null,
    open: async () => {},
    async relay(req) {
      const res = req.command === 'GetTree'
        ? { messages: [{ command: 'Result', from: 'GetTree', result: { root: 1, tree: { 1: { id: 1, class: 'AllObjects' } } }, transactionID: req.transactionID }], binaryMessages: [] }
        : { messages: [{ command: 'Result', from: 'Execute', result: { result: 42 }, transactionID: req.transactionID }], binaryMessages: [] }
      for (const hear of replies) hear(req, res, 'guest')
      return res
    },
    onEngineReply: l => (replies.add(l), () => replies.delete(l)),
    onEngineStart: () => () => {},
    engineContainers: () => [],
    request: async () => { throw new Error('not a server') },
  }
  const toHost = []
  const hub = createSessionHub({ client, queue: work => work(), toHost: f => toHost.push(f) })
  const guest = hub.createInvite('edit', 'guest')
  const offer = offerOnRelay({ relay: RELAY, hub, invite: guest.invite })
  t.after(() => (offer.close(), hub.close()))
  assert.equal(await offer.whenLive(5000), true, 'the relay took the offer: it saw this machine\'s sign-in')
  assert.equal(offer.url, `${RELAY}/?invite=${guest.invite}`)

  const g = socket(`${SESSION}/?invite=${guest.invite}`)
  await g.opened
  g.ws.send(JSON.stringify({ command: 'Execute', commandVersion: 'v1', transactionID: 't1', task: [{ 'v1.part.box': [{}] }] }))
  assert.ok(await until(() => g.json().some(f => f.command === 'Result')))
  const frames = g.json()
  assert.deepEqual(frames[0], { command: 'SessionJoined', role: 'edit', inviteName: 'guest' }, 'the hub greets the guest, through the relay')
  assert.equal(frames.find(f => f.command === 'Result').result, 42, 'a guest\'s command reaches the engine, and its answer the guest')
  assert.equal(toHost.find(f => f.command === 'PeerJoined')?.inviteName, 'guest')
  assert.equal(hub.guests, 1)

  // The invite is taken back: the guest hears why, and the link is good for nothing.
  assert.equal(hub.revokeInvite(guest.invite).kicked, 1)
  assert.deepEqual(await g.closed, { code: 1008, reason: 'invite revoked' })
  offer.close()
  await sleep(300)
  await assert.rejects(socket(`${SESSION}/?invite=${guest.invite}`).opened, /HTTP 403/)
})
