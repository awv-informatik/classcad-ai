// Local WASM engine contract — LIVE: downloads the release assets on first
// run (~85 MB; the dev key is built in, CLASSCAD_WASM_KEY overrides).
//   1. engine policy "wasm": the shim serves a session on the MCP's own engine
//      (no worker, no daemon bridge involved) — run_script, tree, snapshot work
//   2. policy "auto" with no worker reachable: falls back to the local engine
//   3. policy "drogon" with no worker: a clear error, no fallback
//   4. use_session(engine) switches at runtime
import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const SERVER = join(here, '..', 'dist', 'server.js')
const freePort = () => new Promise(r => { const s = createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)) }) })

function shim(env) {
  const p = spawn(process.execPath, [SERVER], { env: { ...process.env, ...env }, stdio: ['pipe', 'pipe', 'pipe'] })
  const stderr = []
  p.stderr.on('data', d => stderr.push(d.toString()))
  let buf = ''; const waiters = new Map(); let n = 0
  p.stdout.on('data', d => { buf += d; let i; while ((i = buf.indexOf('\n')) >= 0) { const line = buf.slice(0, i); buf = buf.slice(i + 1); try { const m = JSON.parse(line); if (m.id != null && waiters.has(m.id)) { waiters.get(m.id)(m); waiters.delete(m.id) } } catch {} } })
  const call = (method, params) => new Promise((resolve, reject) => { const id = ++n; const timer = setTimeout(() => { if (waiters.has(id)) { waiters.delete(id); reject(new Error('timeout ' + method)) } }, 180000); waiters.set(id, m => { clearTimeout(timer); resolve(m) }); p.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n') })
  const init = async () => { const r = await call('initialize', { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'wasm-live', version: '0' } }); p.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n'); return r }
  const tool = async (name, args = {}) => { const m = await call('tools/call', { name, arguments: args }); const c = m.result?.content || []; const t = (c.find(b => b.type === 'text') || {}).text; let parsed; try { parsed = JSON.parse(t) } catch { parsed = t } return { isError: !!m.result?.isError, text: t, value: parsed, content: c } }
  const exit = () => new Promise(r => { p.once('exit', r); p.stdin.end() })
  return { p, call, init, tool, exit, stderr: () => stderr.join('') }
}

test('local WASM engine through the MCP (policy wasm / auto fallback / drogon)', async () => {
  const deadWorker = `ws://127.0.0.1:${await freePort()}/`   // nothing listens here
  const base = {
    CLASSCAD_MCP_PORT: String(await freePort()),
    CLASSCAD_BRIDGE_LISTEN: `ws://127.0.0.1:${await freePort()}/bridge`,
    CLASSCAD_WS_URL: deadWorker,
    CLASSCAD_DAEMON_IDLE_MS: '1500',
  }
  // 1. policy wasm
  const a = shim({ ...base, CLASSCAD_ENGINE: 'wasm' })
  try {
    await a.init()
    const run = await a.tool('run_script', { script: 'const p = await api.v1.part.create({ name: "W" }); const pid = p?.result ?? p; await api.v1.part.box({ id: pid, length: 30, width: 20, height: 10, name: "WasmBox" }); return { pid }' })
    assert.ok(!run.isError, 'run_script on the local engine: ' + run.text)
    const info = (await a.tool('session_info')).value
    assert.equal(info.transport, 'wasm')
    assert.equal(info.wasm.running, true)
    const tree = (await a.tool('tree')).value
    assert.ok(tree.nodes.some(n => n.name === 'WasmBox'), 'box in the local engine tree')
    const snap = await a.tool('snapshot', {})
    assert.ok(snap.content.some(b => b.type === 'image'), 'snapshot renders from the local engine graphic')
  } finally {
    await a.exit()
  }
  // 2. auto → fallback (worker dead)
  const b = shim({ ...base, CLASSCAD_ENGINE: 'auto' })
  try {
    await b.init()
    const tree = await b.tool('tree', { refresh: true })
    assert.ok(!tree.isError, 'auto falls back to wasm: ' + tree.text)
    assert.equal((await b.tool('session_info')).value.transport, 'wasm')
    // 4. switch explicitly to the worker → error (dead), back to wasm → fine
    const d = await b.tool('use_session', { engine: 'drogon' })
    assert.ok(d.isError, 'drogon with no worker must fail')
    assert.match(d.value.error, /ECONNREFUSED|timeout|refused/i)
    const w = await b.tool('use_session', { engine: 'wasm' })
    assert.ok(!w.isError, w.text)
    assert.equal(w.value.transport, 'wasm')
  } finally {
    await b.exit()
  }
  // 3. drogon policy, dead worker: no fallback, clear message
  const c = shim({ ...base, CLASSCAD_ENGINE: 'drogon' })
  try {
    await c.init()
    const r = await c.tool('tree', { refresh: true })
    assert.ok(r.isError || /ECONNREFUSED|refused|timeout/i.test(r.text), 'drogon policy does not fall back: ' + r.text)
  } finally {
    await c.exit()
  }
})

test('auto: a worker that comes up later takes over an EMPTY local session, never a modeled one', async () => {
  const { startFakeWorker } = await import('../../script/test/fake-worker.mjs')
  const workerPort = await freePort()
  const env = {
    CLASSCAD_MCP_PORT: String(await freePort()),
    CLASSCAD_BRIDGE_LISTEN: `ws://127.0.0.1:${await freePort()}/bridge`,
    CLASSCAD_WS_URL: `ws://127.0.0.1:${workerPort}/`,   // nothing there yet
    CLASSCAD_DAEMON_IDLE_MS: '1500',
    CLASSCAD_ENGINE: 'auto',
  }
  const empty = shim(env)
  const modeled = shim(env)
  let worker
  try {
    await empty.init()
    await modeled.init()
    // both fall back: no worker
    assert.equal((await empty.tool('run_script', { script: 'return 1' })).isError, false)
    assert.equal((await empty.tool('session_info')).value.transport, 'wasm')
    const built = await modeled.tool('run_script', { script: 'await api.v1.part.create({ name: "Kept" }); return 1' })
    assert.equal(built.isError, false, built.text)
    assert.equal((await modeled.tool('session_info')).value.transport, 'wasm')

    worker = await startFakeWorker({ port: workerPort })
    await new Promise(r => setTimeout(r, 3200))   // past the probe throttle
    await empty.tool('run_script', { script: 'return 2' })
    assert.equal((await empty.tool('session_info')).value.transport, 'ws', 'empty session moved to the worker')
    await modeled.tool('run_script', { script: 'return 2' })
    assert.equal((await modeled.tool('session_info')).value.transport, 'wasm', 'session with a model stays on WASM')
  } finally {
    await empty.exit()
    await modeled.exit()
    await worker?.close()
  }
})
