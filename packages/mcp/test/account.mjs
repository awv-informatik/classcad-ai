// The `account` tool — runs on every build (postbuild), no network: a fake Firebase
// sign-in (fake-auth.mjs) and a stand-in for the plans backend (GET /me, /domains,
// /tokens, /plans), with the public plans as the live backend lists them.
//   1. Free: localhost only, public domains named with the plan that has them, not
//      commercial, no public token → where to make one
//   2. Solo on its trial: the trial's end, commercial, the public token handed over
//   3. Pro: only the ACTIVE registered domains are where the app may run
//   4. an unconfirmed address: domains and tokens unavailable, the reason said
//   5. the backend unreachable: an error, not a made-up answer
//   6. not signed in: the sign-in gate, as for every tool but the open ones
import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { createServer as netServer } from 'node:net'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { fakeAuth } from './fake-auth.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const SERVER = join(here, '..', 'dist', 'server.js')
const freePort = () => new Promise(r => { const s = netServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)) }) })

function shim(env) {
  const p = spawn(process.execPath, [SERVER], { env: { ...process.env, ...env }, stdio: ['pipe', 'pipe', 'pipe'] })
  let buf = ''; const waiters = new Map(); let n = 0
  p.stdout.on('data', d => { buf += d; let i; while ((i = buf.indexOf('\n')) >= 0) { const line = buf.slice(0, i); buf = buf.slice(i + 1); try { const m = JSON.parse(line); if (m.id != null && waiters.has(m.id)) { waiters.get(m.id)(m); waiters.delete(m.id) } } catch {} } })
  const call = (method, params) => new Promise((resolve, reject) => { const id = ++n; const timer = setTimeout(() => { if (waiters.has(id)) { waiters.delete(id); reject(new Error('timeout ' + method)) } }, 60000); waiters.set(id, m => { clearTimeout(timer); resolve(m) }); p.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n') })
  const init = async () => { const r = await call('initialize', { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'Account Test', version: '0' } }); p.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n'); return r }
  const tool = async (name, args = {}) => { const m = await call('tools/call', { name, arguments: args }); const t = (m.result?.content?.find(b => b.type === 'text') || {}).text ?? ''; let value = null; try { value = JSON.parse(t) } catch {} return { isError: !!m.result?.isError, text: t, value } }
  const exit = () => new Promise(r => { if (p.exitCode !== null || p.signalCode !== null) return r(); p.once('exit', r); p.stdin.end() })
  return { init, tool, exit }
}

// The public plans as GET /plans answers them (rights only; prices left out)
const PLANS = [
  { id: 'free', label: 'Free', commercial: false, native: false, domainsPerSeat: 0, wildcards: false },
  { id: 'solo', label: 'Solo', commercial: true, native: false, domainsPerSeat: 0, wildcards: false },
  { id: 'pro', label: 'Pro', commercial: true, native: false, domainsPerSeat: 1, wildcards: false },
  { id: 'business', label: 'Business', commercial: true, native: true, domainsPerSeat: null, wildcards: true },
]
const rights = id => ({ ...PLANS.find(p => p.id === id), wasm: true, exportFormats: id === 'free' ? ['stl', 'glb', 'gltf', 'vrml'] : id === 'solo' ? ['stl', 'step', 'ofb'] : ['*'] })

/** The plans backend's account routes; `account` is swapped per case. */
async function fakeBackend() {
  const seen = []
  const state = { account: null, down: false }
  const server = createServer((req, res) => {
    const path = new URL(req.url, 'http://x').pathname.replace(/^\/api\/v1/, '')
    seen.push({ path, auth: req.headers.authorization ?? null })
    res.setHeader('content-type', 'application/json')
    const send = (status, body) => { res.statusCode = status; res.end(JSON.stringify(body)) }
    if (state.down) return req.socket.destroy()
    if (path === '/plans') return send(200, { plans: PLANS, prices: [], trialDays: 14, freeKeyDays: null })
    if (!req.headers.authorization?.startsWith('Bearer ')) return send(401, { code: 'unauthenticated', message: 'Send a sign-in.' })
    const a = state.account
    if (path === '/me') return send(200, a.me)
    if (path === '/domains' || path === '/tokens') {
      if (a.me.emailVerified === false) return send(403, { code: 'email_not_verified', message: 'Confirm your email address first.' })
      return send(200, path === '/domains' ? a.domains : a.tokens)
    }
    send(404, { code: 'not_found', message: path })
  })
  await new Promise(r => server.listen(0, '127.0.0.1', r))
  server.unref()
  return { url: `http://127.0.0.1:${server.address().port}/api/v1/key`, state, seen, close: () => new Promise(r => server.close(r)) }
}

const me = (planId, extra = {}) => ({
  uid: 'uid-test', email: 'test@example.com', emailVerified: true, plan: rights(planId),
  entitlement: { plan: planId, source: 'free', until: null, status: null }, trial: { granted: true, endsAt: Date.UTC(2026, 0, 1), active: false }, ...extra,
})

test('account: plan, where an app may run and the public token, per plan', async () => {
  const backend = await fakeBackend()
  const auth = await fakeAuth()
  const env = { ...auth.env, CLASSCAD_KEY_URL: backend.url, CLASSCAD_MCP_PORT: String(await freePort()), CLASSCAD_WS_URL: `ws://127.0.0.1:${await freePort()}/`, CLASSCAD_DAEMON_IDLE_MS: '1500' }
  const a = shim(env)
  try {
    await a.init()

    // 1. Free, no token yet
    backend.state.account = { me: me('free'), domains: { plan: 'free', allowed: false, wildcards: false, limit: 0, domains: [] }, tokens: { tokens: [], offlineKeys: [] } }
    let r = await a.tool('account')
    assert.equal(r.isError, false, r.text)
    let v = r.value
    assert.equal(v.plan.id, 'free')
    assert.equal(v.plan.commercial, false)
    assert.equal(v.plan.commercialWith, 'Solo', 'the first plan with commercial use')
    assert.match(v.app.hosting, /localhost only/)
    assert.match(v.app.hosting, /Public domains come with Pro/, 'the first plan with public domains: ' + v.app.hosting)
    assert.deepEqual(v.app.runsOn, ['http(s)://localhost:<any port>', 'http(s)://127.0.0.1:<any port>'])
    assert.match(v.app.engine, /native engine on own servers comes with Business/)
    assert.deepEqual(v.tokens.public, [])
    assert.match(v.tokens.make, /classcad\.test\/account → Access tokens → New token, kind Public/, 'the sign-in site\'s account page: ' + v.tokens.make)
    assert.ok(backend.seen.filter(s => s.path !== '/plans').every(s => s.auth === backend.seen.find(x => x.path === '/me').auth && s.auth?.startsWith('Bearer ')), 'the sign-in goes along')

    // 2. Solo on its trial, with a public token
    backend.state.account = {
      me: me('solo', { entitlement: { plan: 'solo', source: 'trial', until: null, status: null }, trial: { granted: true, endsAt: Date.UTC(2026, 9, 23), active: true } }),
      domains: { plan: 'solo', allowed: false, wildcards: false, limit: 0, domains: [] },
      tokens: { tokens: [{ id: 't1', type: 'public', name: 'shop', prefix: 'ccpk_abcd', token: 'ccpk_abcdefgh' }, { id: 't2', type: 'secret', name: 'ci', prefix: 'ccsk_wxyz', token: null }], offlineKeys: [] },
    }
    v = (await a.tool('account')).value
    assert.equal(v.plan.until, '2026-10-23', 'a trial shows its end')
    assert.equal(v.plan.commercial, true)
    assert.equal(v.plan.commercialWith, undefined)
    assert.deepEqual(v.tokens.public, [{ name: 'shop', token: 'ccpk_abcdefgh' }])
    assert.equal(v.tokens.secret, 1)
    assert.equal(v.tokens.make, undefined, 'nothing to make with a public token at hand')
    assert.match(v.app.hosting, /Solo runs a web app on localhost only/)

    // 3. Pro: only active domains count
    backend.state.account = {
      me: me('pro', { entitlement: { plan: 'pro', source: 'subscription', until: Date.UTC(2027, 0, 31), status: 'active' } }),
      domains: { plan: 'pro', allowed: true, wildcards: false, limit: 1, domains: [{ id: 'd1', pattern: 'https://shop.example.com', active: true }, { id: 'd2', pattern: 'https://old.example.com', active: false }] },
      tokens: { tokens: [], offlineKeys: [] },
    }
    v = (await a.tool('account')).value
    assert.equal(v.plan.until, '2027-01-31')
    assert.deepEqual(v.app.domains.registered, ['https://shop.example.com'])
    assert.ok(v.app.runsOn.includes('https://shop.example.com') && !v.app.runsOn.includes('https://old.example.com'))
    assert.match(v.app.hosting, /registered domains: https:\/\/shop\.example\.com\./)
    assert.equal(v.app.domains.limit, 1)
    assert.equal(v.app.domains.wildcardsWith, 'Business')

    // 3b. Pro without a registered domain yet
    backend.state.account.domains = { plan: 'pro', allowed: true, wildcards: false, limit: 1, domains: [] }
    v = (await a.tool('account')).value
    assert.match(v.app.hosting, /none registered yet — add them under Domains on https:\/\/classcad\.test\/account \(up to 1\)/, v.app.hosting)

    // 4. an unconfirmed address
    backend.state.account = { me: me('free', { emailVerified: false }), domains: null, tokens: null }
    r = await a.tool('account')
    assert.equal(r.isError, false, r.text)
    assert.match(r.value.tokens.unavailable, /Confirm your email/)
    assert.match(r.value.tokens.reason, /confirm the account's email address first/)
    assert.match(r.value.app.domains.unavailable, /Confirm your email/)

    // 5. the backend unreachable
    backend.state.down = true
    r = await a.tool('account')
    assert.equal(r.isError, true)
    assert.match(r.text, /could not be read: the ClassCAD account service cannot be reached/)
    backend.state.down = false
  } finally {
    await a.exit()
    await backend.close()
  }
})

test('account: not signed in → the sign-in gate', async () => {
  const backend = await fakeBackend()
  const auth = await fakeAuth({ signedIn: false })
  const a = shim({ ...auth.env, CLASSCAD_KEY_URL: backend.url, CLASSCAD_MCP_PORT: String(await freePort()), CLASSCAD_WS_URL: `ws://127.0.0.1:${await freePort()}/`, CLASSCAD_DAEMON_IDLE_MS: '1500' })
  try {
    await a.init()
    const r = await a.tool('account')
    assert.equal(r.isError, true)
    assert.match(r.text, /Sign-in required/)
    assert.equal(backend.seen.length, 0, 'nothing asked of the backend without a sign-in')
  } finally {
    await a.exit()
    await backend.close()
  }
})
