// Daemon contract — runs on every build (postbuild).
//   1. the stdio shim starts the daemon when none runs, and proxies MCP to it
//   2. a second shim reuses the SAME daemon (one process, one bridge port);
//      each shim is its own session (health.sessions counts them)
//   3. sessions are independent (session_info per session)
//   4. when the last shim goes away the daemon exits after the idle period
//   5. a foreign program on the daemon port → the shim serves in-process
//   6. a daemon of another build that still has sessions is told to drain:
//      the new shim serves in-process, the old daemon refuses new sessions
//      and exits right after its last session
import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { startFakeWorker } from '../../script/test/fake-worker.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const SERVER = join(here, '..', 'dist', 'server.js')

const freePort = () => new Promise(r => { const s = createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)) }) })
const sleep = ms => new Promise(r => setTimeout(r, ms))
const health = async port => { try { const r = await fetch(`http://127.0.0.1:${port}/health`, { signal: AbortSignal.timeout(800) }); return r.ok ? await r.json() : null } catch { return null } }

/** Spawns a shim and returns a tiny JSON-RPC driver over its stdio. */
function shim(env) {
  const p = spawn(process.execPath, [SERVER], { env: { ...process.env, ...env }, stdio: ['pipe', 'pipe', 'pipe'] })
  const stderr = []
  p.stderr.on('data', d => stderr.push(d.toString()))
  let buf = ''; const waiters = new Map(); let n = 0
  p.stdout.on('data', d => { buf += d; let i; while ((i = buf.indexOf('\n')) >= 0) { const line = buf.slice(0, i); buf = buf.slice(i + 1); try { const m = JSON.parse(line); if (m.id != null && waiters.has(m.id)) { waiters.get(m.id)(m); waiters.delete(m.id) } } catch {} } })
  const call = (method, params) => new Promise((resolve, reject) => { const id = ++n; const timer = setTimeout(() => { if (waiters.has(id)) { waiters.delete(id); reject(new Error('timeout ' + method)) } }, 15000); waiters.set(id, m => { clearTimeout(timer); resolve(m) }); p.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n') })
  const init = async () => { const r = await call('initialize', { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'daemon-test', version: '0' } }); p.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n'); return r }
  const tool = async (name, args = {}) => { const m = await call('tools/call', { name, arguments: args }); const c = m.result?.content || []; return JSON.parse((c.find(b => b.type === 'text') || {}).text ?? 'null') }
  const exit = () => new Promise(r => { p.once('exit', r); p.stdin.end() })
  return { p, call, init, tool, exit, stderr: () => stderr.join('') }
}

test('daemon: one process per machine, one session per shim, idle exit', async () => {
  const worker = await startFakeWorker()
  const port = await freePort()
  const bridgePort = await freePort()
  const env = {
    CLASSCAD_MCP_PORT: String(port),
    CLASSCAD_BRIDGE_LISTEN: `ws://127.0.0.1:${bridgePort}/bridge`,
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
    assert.ok(tools.result.tools.some(t => t.name === 'bridge.list_clients'), 'bridge tools present → the daemon owns a bridge listener')
    let h = await health(port)
    assert.equal(h?.name, 'classcad-mcp')
    assert.equal(h.sessions, 1, 'one session')
    assert.equal(h.bridge, `ws://127.0.0.1:${bridgePort}/bridge`)
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
  const a = shim({ CLASSCAD_MCP_PORT: String(port), CLASSCAD_WS_URL: worker.url, CLASSCAD_BRIDGE_LISTEN: `ws://127.0.0.1:${await freePort()}/bridge` })
  try {
    const init = await a.init()
    assert.equal(init.result?.serverInfo?.name, 'classcad')
    const tools = await a.call('tools/list', {})
    assert.ok(tools.result.tools.some(t => t.name === 'run_script'))
    assert.ok(!tools.result.tools.some(t => t.name === 'bridge.list_clients'), 'no bridge tools in-process')
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
    CLASSCAD_BRIDGE_LISTEN: `ws://127.0.0.1:${await freePort()}/bridge`,
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
