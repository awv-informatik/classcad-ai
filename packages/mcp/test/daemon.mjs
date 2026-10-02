// Daemon contract — runs on every build (postbuild).
//   1. the stdio shim starts the daemon when none runs, and proxies MCP to it
//   2. a second shim reuses the SAME daemon (one process, one listener for apps);
//      each shim is its own session (health.sessions counts them)
//   3. sessions are independent (session_info per session)
//   4. when the last shim goes away the daemon exits after the idle period
//   5. a foreign program on the daemon port → the shim serves in-process
//   6. a daemon of another build that still has sessions is told to drain:
//      the new shim serves in-process, the old daemon refuses new sessions
//      and exits right after its last session
//   7. browsers are refused: an Origin header or a non-loopback Host → 403
//   8. `classcad-mcp stop` refuses while sessions are active, `stop --force`
//      terminates the daemon; its shims reconnect to a fresh daemon on the next call
//   9. an app that offers a session of its own keeps the daemon alive past the
//      idle period — and does not keep it from stopping when it is asked to
import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { spawn, execFile } from 'node:child_process'
import { request } from 'node:http'
import { createServer } from 'node:net'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { fakeAuth } from './fake-auth.mjs'
import { tmpdir } from 'node:os'
import { startFakeWorker } from '../../script/test/fake-worker.mjs'
import WebSocket from 'ws'

const here = dirname(fileURLToPath(import.meta.url))
const SERVER = join(here, '..', 'dist', 'server.js')
// Every shim runs signed in (a fake Firebase token endpoint, own auth file).
const AUTH = (await fakeAuth()).env

const freePort = () => new Promise(r => { const s = createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)) }) })
const sleep = ms => new Promise(r => setTimeout(r, ms))
// a connection of its own per question: a kept-alive one that sat idle answers late on some Node versions
const health = async port => { try { const r = await fetch(`http://127.0.0.1:${port}/health`, { headers: { connection: 'close' }, signal: AbortSignal.timeout(800) }); return r.ok ? await r.json() : null } catch { return null } }

/** Spawns a shim and returns a tiny JSON-RPC driver over its stdio. */
function shim(env) {
  const p = spawn(process.execPath, [SERVER], { env: { ...process.env, ...AUTH, ...env }, stdio: ['pipe', 'pipe', 'pipe'] })
  const stderr = []
  p.stderr.on('data', d => stderr.push(d.toString()))
  let buf = ''; const waiters = new Map(); let n = 0
  p.stdout.on('data', d => { buf += d; let i; while ((i = buf.indexOf('\n')) >= 0) { const line = buf.slice(0, i); buf = buf.slice(i + 1); try { const m = JSON.parse(line); if (m.id != null && waiters.has(m.id)) { waiters.get(m.id)(m); waiters.delete(m.id) } } catch {} } })
  const call = (method, params) => new Promise((resolve, reject) => { const id = ++n; const timer = setTimeout(() => { if (waiters.has(id)) { waiters.delete(id); reject(new Error('timeout ' + method)) } }, 15000); waiters.set(id, m => { clearTimeout(timer); resolve(m) }); p.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n') })
  const init = async () => { const r = await call('initialize', { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'daemon-test', version: '0' } }); p.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n'); return r }
  const tool = async (name, args = {}) => { const m = await call('tools/call', { name, arguments: args }); const c = m.result?.content || []; return JSON.parse((c.find(b => b.type === 'text') || {}).text ?? 'null') }
  // A shim that is gone already has nothing left to say: waiting for its exit would wait forever.
  const exit = () => new Promise(r => { if (p.exitCode !== null || p.signalCode !== null) return r(); p.once('exit', r); p.stdin.end() })
  return { p, call, init, tool, exit, stderr: () => stderr.join('') }
}

test('daemon: one process per machine, one session per shim, idle exit', async () => {
  const worker = await startFakeWorker()
  const port = await freePort()
  const env = {
    CLASSCAD_MCP_PORT: String(port),
    CLASSCAD_WS_URL: worker.url,
    CLASSCAD_DAEMON_IDLE_MS: '1500',
    CLASSCAD_MCP_LOG: join(tmpdir(), 'classcad-mcp-test', `daemon-${port}.log`),
  }
  const a = shim(env)
  try {
    // 1. first shim starts the daemon and talks to it
    const init = await a.init()
    assert.equal(init.result?.serverInfo?.name, 'classcad')
    const tools = await a.call('tools/list', {})
    assert.ok(tools.result.tools.some(t => t.name === 'run_script'), 'tools served through the daemon')
    assert.ok(tools.result.tools.some(t => t.name === 'get_selection') && tools.result.tools.some(t => t.name === 'view'), 'the tools of a shared session')
    assert.ok(!tools.result.tools.some(t => t.name.startsWith('bridge')), 'no bridge tools any more')
    let h = await health(port)
    assert.equal(h?.name, 'classcad-mcp')
    assert.equal(h.sessions, 1, 'one session')
    assert.equal(h.apps, 0, 'nobody docked')
    assert.equal(h.bridge, undefined, 'no bridge listener any more')
    assert.match(a.stderr(), /using daemon/, 'shim reports the daemon it uses')

    // 2./3. second shim: same daemon (same pid), second independent session
    const b = shim(env)
    await b.init()
    const h2 = await health(port)
    assert.equal(h2.pid, h.pid, 'no second daemon')
    assert.equal(h2.sessions, 2, 'two sessions')
    const infoA = await a.tool('session_info')
    const infoB = await b.tool('session_info')
    assert.equal(infoA.transport, 'ws')
    assert.equal(infoB.transport, 'ws')
    // a mutation in A does not touch B's session/caches (separate clients)
    await a.tool('run_script', { script: 'await api.v1.part.create({ name: "A" }); return 1' })
    const treeB = await b.tool('tree')
    assert.equal(treeB.nodeCount, 1, 'B still sees its own (empty) drawing')

    // 4. shims go away → daemon exits after idle
    await a.exit()
    await sleep(300)
    assert.equal((await health(port))?.sessions, 1, 'A gone, B stays')
    await b.exit()
    let gone = false
    for (let i = 0; i < 40; i++) { await sleep(250); if (!(await health(port))) { gone = true; break } }
    assert.ok(gone, 'daemon exited after the idle period')
  } finally {
    try { a.p.kill() } catch {}
    await worker.close()
  }
})

test('daemon: foreign program on the port → the shim serves in-process', async () => {
  const worker = await startFakeWorker()
  const port = await freePort()
  const foreign = createServer(sock => sock.end())
  await new Promise(r => foreign.listen(port, '127.0.0.1', r))
  const a = shim({ CLASSCAD_MCP_PORT: String(port), CLASSCAD_WS_URL: worker.url })
  try {
    const init = await a.init()
    assert.equal(init.result?.serverInfo?.name, 'classcad')
    const tools = await a.call('tools/list', {})
    assert.ok(tools.result.tools.some(t => t.name === 'run_script'))
    assert.ok(tools.result.tools.some(t => t.name === 'get_selection'), 'the same tools in-process')
    assert.match(a.stderr(), /serving in-process/)
  } finally {
    await a.exit()
    foreign.close()
    await worker.close()
  }
})

test('daemon: another build with live sessions → drain, new shim in-process', async () => {
  const worker = await startFakeWorker()
  const port = await freePort()
  const env = {
    CLASSCAD_MCP_PORT: String(port),
    CLASSCAD_WS_URL: worker.url,
    CLASSCAD_DAEMON_IDLE_MS: '60000',
  }
  const old = shim({ ...env, CLASSCAD_MCP_BUILD: 'build-A' })
  try {
    await old.init()
    const h1 = await health(port)
    assert.equal(h1.build, 'build-A')
    assert.equal(h1.sessions, 1)
    const neu = shim({ ...env, CLASSCAD_MCP_BUILD: 'build-B' })
    try {
      await neu.init()
      assert.match(neu.stderr(), /runs the current build in-process/, 'new shim serves itself')
      const h2 = await health(port)
      assert.equal(h2.pid, h1.pid, 'old daemon still there')
      assert.equal(h2.draining, true, 'old daemon drains')
      assert.equal(h2.sessions, 1, 'the new tab is not a session of the old daemon')
      const tools = await neu.call('tools/list', {})
      assert.ok(tools.result.tools.some(t => t.name === 'run_script'))
      // a third shim of the OLD build is refused by the draining daemon and serves in-process too
      const third = shim({ ...env, CLASSCAD_MCP_BUILD: 'build-A' })
      try {
        await third.init()
        assert.match(third.stderr(), /draining; this tab runs in-process/)
      } finally {
        await third.exit()
      }
    } finally {
      await neu.exit()
    }
    await old.exit()
    let gone = false
    for (let i = 0; i < 20; i++) { await sleep(250); if (!(await health(port))) { gone = true; break } }
    assert.ok(gone, 'drained daemon exits right after its last session (no idle wait)')
  } finally {
    try { old.p.kill() } catch {}
    await worker.close()
  }
})

/** Raw HTTP (fetch forbids setting Host). */
const rawPost = (port, path, headers) => new Promise((resolve, reject) => {
  const req = request({ host: '127.0.0.1', port, path, method: 'POST', headers }, res => { res.resume(); res.on('end', () => resolve(res.statusCode)) })
  req.on('error', reject)
  req.end()
})
const runCli = (env, ...args) => new Promise(resolve => {
  execFile(process.execPath, [SERVER, ...args], { env: { ...process.env, ...env }, timeout: 15000 }, (err, stdout, stderr) => resolve({ code: err ? err.code ?? 1 : 0, stdout, stderr }))
})

test('daemon: browser requests refused, CLI stop / stop --force', async () => {
  const worker = await startFakeWorker()
  const port = await freePort()
  const env = {
    CLASSCAD_MCP_PORT: String(port),
    CLASSCAD_WS_URL: worker.url,
    CLASSCAD_DAEMON_IDLE_MS: '1500',
  }
  const a = shim(env)
  try {
    await a.init()
    const h = await health(port)
    assert.equal(h.sessions, 1)

    // 7. a web page (Origin) or a DNS-rebound name (Host) cannot reach any endpoint
    assert.equal(await rawPost(port, '/shutdown', { origin: 'https://evil.example' }), 403, 'Origin refused')
    assert.equal(await rawPost(port, '/mcp', { host: `evil.example:${port}`, 'content-type': 'application/json' }), 403, 'rebound Host refused')
    assert.equal(await rawPost(port, '/shutdown', { host: `localhost:${port}` }), 409, 'loopback client still served')

    // 8. status / stop / stop --force
    const status = await runCli(env, 'status')
    assert.equal(status.code, 0)
    assert.equal(JSON.parse(status.stdout).pid, h.pid)
    const polite = await runCli(env, 'stop')
    assert.equal(polite.code, 1, 'stop refuses with an active session')
    assert.match(polite.stderr, /--force/)
    assert.equal((await health(port))?.pid, h.pid, 'daemon still running')
    const forced = await runCli(env, 'stop', '--force')
    assert.equal(forced.code, 0, forced.stderr)
    assert.equal(await health(port), null, 'daemon gone')
    const again = await runCli(env, 'stop')
    assert.equal(again.code, 0)
    assert.match(again.stdout, /no classcad-mcp daemon/)

    // 9. the tab survives: its next call starts a fresh daemon and replays the handshake
    const info = await a.tool('session_info')
    assert.equal(info.transport, 'ws', 'tool call answered after the forced stop')
    const h2 = await health(port)
    assert.ok(h2 && h2.pid !== h.pid, 'a new daemon serves the tab')
    assert.equal(h2.sessions, 1)
    assert.match(a.stderr(), /reconnected to daemon/)
    await a.exit()
    let gone = false
    for (let i = 0; i < 40; i++) { await sleep(250); if (!(await health(port))) { gone = true; break } }
    assert.ok(gone, 'new daemon exits after the idle period')
  } finally {
    try { a.p.kill() } catch {}
    await worker.close()
  }
})

// Claude Code 2.1.286+ speaks before the handshake: a `server/discover` probe
// (MCP 2026-07-28) that a server of an earlier protocol answers with "method
// not found", after which the host sends `initialize`. The shim used to forward
// the probe to the daemon, took the refusal for a dead daemon and exited.
const DISCOVER = { _meta: { 'io.modelcontextprotocol/protocolVersion': '2026-07-28' } }

test('daemon: a host that probes before initialize (server/discover) still connects', async () => {
  const worker = await startFakeWorker()
  const env = {
    CLASSCAD_MCP_PORT: String(await freePort()),
    CLASSCAD_WS_URL: worker.url,
    CLASSCAD_DAEMON_IDLE_MS: '1500',
  }
  const a = shim(env)
  try {
    const probe = await a.call('server/discover', DISCOVER)
    assert.equal(probe.error?.code, -32601, 'the probe is answered with "method not found": ' + JSON.stringify(probe))
    const ping = await a.call('ping', {})
    assert.deepEqual(ping.result, {}, 'ping before initialize is answered')
    const init = await a.init()
    assert.equal(init.result?.serverInfo?.name, 'classcad', 'initialize after the probe: ' + JSON.stringify(init).slice(0, 200))
    const tools = await a.call('tools/list', {})
    assert.ok(tools.result.tools.some(t => t.name === 'run_script'), 'tools after the probe')
    assert.doesNotMatch(a.stderr(), /daemon unreachable|session ended/)
    // the daemon itself names the refused request, for hosts that speak HTTP to it directly
    const direct = await fetch(`http://127.0.0.1:${env.CLASSCAD_MCP_PORT}/mcp`, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' }, body: JSON.stringify({ jsonrpc: '2.0', id: 'server-discover-probe', method: 'server/discover', params: DISCOVER }) })
    const body = await direct.json()
    assert.equal(body.id, 'server-discover-probe')
    assert.equal(body.error?.code, -32601)
  } finally {
    await a.exit()
    await worker.close()
  }
})

test('daemon: the probe before initialize is answered in-process too (foreign program on the port)', async () => {
  const worker = await startFakeWorker()
  const port = await freePort()
  const foreign = createServer(sock => sock.end())
  await new Promise(r => foreign.listen(port, '127.0.0.1', r))
  const a = shim({ CLASSCAD_MCP_PORT: String(port), CLASSCAD_WS_URL: worker.url })
  try {
    const probe = await a.call('server/discover', DISCOVER)
    assert.ok(probe.error, 'the probe gets an error answer, not silence: ' + JSON.stringify(probe))
    const init = await a.init()
    assert.equal(init.result?.serverInfo?.name, 'classcad')
  } finally {
    await a.exit()
    foreign.close()
    await worker.close()
  }
})

test('daemon: gone before the handshake (idle exit) → the shim starts a new one for initialize', async () => {
  const worker = await startFakeWorker()
  const port = await freePort()
  const env = {
    CLASSCAD_MCP_PORT: String(port),
    CLASSCAD_WS_URL: worker.url,
    CLASSCAD_DAEMON_IDLE_MS: '500',
  }
  const a = shim(env)
  try {
    // the shim started a daemon; with no session it idles out before the host speaks
    for (let i = 0; i < 40 && !(await health(port)); i++) await sleep(100)
    for (let i = 0; i < 60 && (await health(port)); i++) await sleep(100)
    assert.equal(await health(port), null, 'daemon idled out')
    const init = await a.init()
    assert.equal(init.result?.serverInfo?.name, 'classcad', 'initialize on a new daemon: ' + JSON.stringify(init).slice(0, 200))
    assert.ok(await health(port), 'a daemon runs again')
  } finally {
    await a.exit()
    await worker.close()
  }
})

test('daemon: a page that offers a session keeps it alive, and does not keep it from stopping', async () => {
  const worker = await startFakeWorker()
  const port = await freePort()
  const a = shim({ CLASSCAD_MCP_PORT: String(port), CLASSCAD_WS_URL: worker.url, CLASSCAD_DAEMON_IDLE_MS: '600', CLASSCAD_MCP_LOG: join(tmpdir(), 'classcad-mcp-test', `daemon-${port}.log`) })
  let page
  try {
    await a.init()
    let h = await health(port)
    for (let i = 0; i < 20 && !h.join; i++) { await sleep(100); h = await health(port) }
    assert.match(h.join, /^ws:\/\/127\.0\.0\.1:\d+\/session$/, 'health names the address sessions are joined on')
    // an app with the engine in its page: a standing connection that offers its invite
    page = new WebSocket(`${h.join}/?host=page-invite-abcdefgh12345678`)
    await new Promise((resolve, reject) => { page.once('open', resolve); page.once('error', reject) })
    const closed = new Promise(resolve => page.once('close', resolve))
    await a.exit()
    await sleep(2000)
    const idle = await health(port)
    assert.ok(idle, 'past the idle period the daemon is still there: somebody may be about to join the page')
    assert.deepEqual({ sessions: idle.sessions, apps: idle.apps }, { sessions: 0, apps: 1 })
    // asked to stop, it stops — the page's open connection notwithstanding
    assert.equal((await fetch(`http://127.0.0.1:${port}/shutdown`, { method: 'POST', headers: { connection: 'close' } })).status, 200)
    let gone = false
    for (let i = 0; i < 24; i++) { await sleep(250); if (!(await health(port))) { gone = true; break } }
    assert.ok(gone, 'the daemon exited')
    await closed
  } finally {
    try { page?.terminate() } catch {}
    try { a.p.kill() } catch {}
    await worker.close()
  }
})
