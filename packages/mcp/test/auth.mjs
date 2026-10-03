// Sign-in contract — runs on every build (postbuild), no network (fake Firebase).
//   1. signed out: engine tools answer "Sign-in required" with a classcad.ch/connect
//      link (port + state); session_info and the docs tools still work
//   2. the loopback: /callback serves the page, /complete refuses a foreign
//      Origin and a wrong state, accepts the right one; a waiting `login`
//      returns the account the moment the browser hands it back
//   3. afterwards engine tools run, and the sign-in is stored for the machine
//   4. a token Firebase rejects (revoked) or one of another project signs out
//   5. login({ logout: true }) signs the machine out
//   6. a refusal that is not about the token (403 key restriction) keeps the sign-in
import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { startFakeWorker } from '../../script/test/fake-worker.mjs'
import { fakeAuth } from './fake-auth.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const SERVER = join(here, '..', 'dist', 'server.js')
const freePort = () => new Promise(r => { const s = createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)) }) })

function shim(env) {
  const p = spawn(process.execPath, [SERVER], { env: { ...process.env, ...env }, stdio: ['pipe', 'pipe', 'pipe'] })
  let buf = ''; const waiters = new Map(); let n = 0
  p.stdout.on('data', d => { buf += d; let i; while ((i = buf.indexOf('\n')) >= 0) { const line = buf.slice(0, i); buf = buf.slice(i + 1); try { const m = JSON.parse(line); if (m.id != null && waiters.has(m.id)) { waiters.get(m.id)(m); waiters.delete(m.id) } } catch {} } })
  const call = (method, params) => new Promise((resolve, reject) => { const id = ++n; const timer = setTimeout(() => { if (waiters.has(id)) { waiters.delete(id); reject(new Error('timeout ' + method)) } }, 60000); waiters.set(id, m => { clearTimeout(timer); resolve(m) }); p.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n') })
  const init = async () => { const r = await call('initialize', { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'Auth Test', version: '0' } }); p.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n'); return r }
  const tool = async (name, args = {}) => { const m = await call('tools/call', { name, arguments: args }); const t = (m.result?.content?.find(b => b.type === 'text') || {}).text ?? ''; return { isError: !!m.result?.isError, text: t } }
  // A shim that is gone already has nothing left to say: waiting for its exit would wait forever.
  const exit = () => new Promise(r => { if (p.exitCode !== null || p.signalCode !== null) return r(); p.once('exit', r); p.stdin.end() })
  return { init, tool, exit }
}

const linkIn = text => {
  const m = /https:\/\/classcad\.test\/connect\?\S+/.exec(text)
  assert.ok(m, 'a sign-in link in: ' + text)
  const u = new URL(m[0])
  return { url: m[0], port: Number(u.searchParams.get('port')), state: u.searchParams.get('state'), client: u.searchParams.get('client') }
}

const complete = (port, body, origin = `http://127.0.0.1:${port}`) =>
  fetch(`http://127.0.0.1:${port}/complete`, { method: 'POST', headers: { 'content-type': 'application/json', origin }, body: JSON.stringify(body) })

test('sign-in: gate, loopback hand-back, waiting login, revocation, logout', async () => {
  const worker = await startFakeWorker()
  const auth = await fakeAuth({ signedIn: false })
  const env = {
    ...auth.env,
    CLASSCAD_MCP_PORT: String(await freePort()),
    CLASSCAD_WS_URL: worker.url,
    CLASSCAD_DAEMON_IDLE_MS: '1500',
  }
  const a = shim(env)
  try {
    await a.init()

    // 1. signed out: the gate answers with a link; status and docs stay open
    const gated = await a.tool('tree')
    assert.ok(gated.isError, 'tree is gated')
    assert.match(gated.text, /Sign-in required/)
    const link = linkIn(gated.text)
    assert.ok(link.port > 0 && link.state.length >= 16, 'link carries port and state')
    assert.equal(link.client, 'Auth Test', 'link names the host')
    assert.doesNotMatch(gated.text, /has just opened/, 'no browser in tests (CLASSCAD_AUTH_NO_BROWSER)')
    const info = JSON.parse((await a.tool('session_info')).text)
    assert.equal(info.auth.signedIn, false)
    assert.ok(!(await a.tool('list_methods', { search: 'box' })).isError, 'docs work signed out')
    assert.equal(linkIn((await a.tool('run_script', { script: 'return 1' })).text).url, link.url, 'one waiting sign-in, one link')

    // 2. the loopback
    const page = await fetch(`http://127.0.0.1:${link.port}/callback`)
    assert.equal(page.status, 200)
    assert.match(await page.text(), /fetch\('\/complete'/)
    assert.equal((await complete(link.port, { state: link.state, token: 'good' }, 'https://evil.example')).status, 403, 'foreign origin refused')
    assert.equal((await complete(link.port, { state: 'x'.repeat(32), token: 'good' })).status, 400, 'wrong state refused')

    const waiting = a.tool('login')   // waits for the hand-back
    await new Promise(r => setTimeout(r, 300))
    const done = await complete(link.port, { state: link.state, token: 'good' })
    assert.equal(done.status, 200)
    assert.equal((await done.json()).email, 'test@example.com')
    const login = await waiting
    assert.match(login.text, /Signed in as test@example\.com/)

    // 3. engine tools run; the sign-in is on disk for the machine
    assert.ok(!(await a.tool('tree')).isError, 'tree runs signed in')
    assert.equal(JSON.parse(readFileSync(auth.file, 'utf8')).email, 'test@example.com')
    assert.equal(JSON.parse((await a.tool('session_info')).text).auth.signedIn, true)

    // 5. logout
    assert.match((await a.tool('login', { logout: true })).text, /Signed out/)
    assert.equal(existsSync(auth.file), false)
    assert.match((await a.tool('tree')).text, /Sign-in required/)
  } finally {
    await a.exit()
  }

  // 4. dead tokens: revoked, or another project's → signed out, file removed
  for (const token of ['revoked', 'other-project']) {
    const b = shim({ ...env, CLASSCAD_MCP_PORT: String(await freePort()) })
    try {
      writeFileSync(auth.file, JSON.stringify({ uid: 'u', email: 'x@example.com', name: null, refreshToken: token, project: 'classcad-app', verifiedAt: Date.now() }))
      await b.init()
      const r = await b.tool('tree')
      assert.ok(r.isError && /no longer valid/.test(r.text) && /Sign-in required/.test(r.text), `${token}: ${r.text}`)
      assert.equal(existsSync(auth.file), false, `${token}: auth file removed`)
    } finally {
      await b.exit()
    }
  }
  // a refusal that is not about the token (key restrictions, outages) keeps the sign-in
  const c = shim({ ...env, CLASSCAD_MCP_PORT: String(await freePort()) })
  try {
    writeFileSync(auth.file, JSON.stringify({ uid: 'u', email: 'x@example.com', name: null, refreshToken: 'blocked', project: 'classcad-app', verifiedAt: Date.now() }))
    await c.init()
    assert.ok(!(await c.tool('tree')).isError, 'recent check counts while Firebase refuses')
    assert.equal(existsSync(auth.file), true, 'sign-in kept')
  } finally {
    await c.exit()
  }
  await worker.close?.()
})
