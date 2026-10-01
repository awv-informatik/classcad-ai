// Local WASM engine contract — LIVE: downloads the release assets on first
// run (~85 MB; a six-month key is built in, CLASSCAD_WASM_KEY overrides).
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
import { fakeAuth } from './fake-auth.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const SERVER = join(here, '..', 'dist', 'server.js')
// Every shim runs signed in (a fake Firebase token endpoint, own auth file).
const AUTH = (await fakeAuth()).env
const freePort = () => new Promise(r => { const s = createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)) }) })

function shim(env) {
  const p = spawn(process.execPath, [SERVER], { env: { ...process.env, ...AUTH, ...env }, stdio: ['pipe', 'pipe', 'pipe'] })
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

test('engine errors surface through run_script (the WASM engine nests maxLevel/messages in result)', async () => {
  const a = shim({
    CLASSCAD_MCP_PORT: String(await freePort()),
    CLASSCAD_BRIDGE_LISTEN: `ws://127.0.0.1:${await freePort()}/bridge`,
    CLASSCAD_WS_URL: `ws://127.0.0.1:${await freePort()}/`,
    CLASSCAD_DAEMON_IDLE_MS: '1500',
    CLASSCAD_ENGINE: 'wasm',
  })
  try {
    await a.init()
    // Points in the XZ plane: the engine rejects them with 1014 at level 51.
    const bad = await a.tool('run_script', { script: `
      const part = (await api.v1.part.create({ name: 'P' })).result
      const ei = (await api.v1.part.entityInjection({ id: part })).result
      const shape = (await api.v1.curve.shape({ id: ei })).result
      await api.v1.curve.polyline2d({ id: shape, points: [[0,0,0],[10,0,0],[10,0,10],[0,0,10]], bulges: [0.5,0,0,0], close: true })
      return 'not reached'` })
    assert.ok(bad.isError, 'strict run_script throws: ' + bad.text)
    assert.match(bad.text, /polyline2d is not planar/)
    // The engine keeps working: the next script sees the part and models on.
    const next = await a.tool('run_script', { script: `
      const again = await api.v1.part.create({ name: 'Q' }).catch(e => String(e))
      return { again }` })
    assert.match(next.text, /already a root assembly or part/, 'a second root is refused loudly, not an empty success: ' + next.text)
  } finally {
    await a.exit()
  }
})

test('local engine: frame guards, and a crashed / hung / wedged engine is replaced', async () => {
  const { connect } = await import('../dist/client.js')
  const { wasmOptionsFromEnv } = await import('../dist/engine/wasm.js')
  const logs = []
  const client = await connect(`ws://127.0.0.1:${await freePort()}/`, { engine: 'wasm', wasm: wasmOptionsFromEnv(), requestTimeoutMs: 20_000, log: m => logs.push(m) })
  const partCount = async () => Object.values(await client.getTree({ refresh: true })).filter(n => n?.class === 'CC_Part').length
  try {
    assert.equal((await client.execute({ 'v1.part.create': [{ name: 'A' }] })).maxLevel, 0)
    assert.equal(await partCount(), 1)

    // 1. an error reported only as ErrorMessage is not an empty success;
    //    a Result with neither value nor level is not an answer at all.
    const engine = client.localEngine
    const real = engine.execute
    engine.execute = async () => ({ messages: [{ command: 'ErrorMessage', attributes: { errorState: 2, errorCode: 7, errorMessage: 'side error' } }, { command: 'Result', from: 'Execute', result: { result: null } }], binaryMessages: [] })
    const side = await client.execute({ 'v1.part.box': [{}] })
    assert.equal(side.maxLevel, 51)
    assert.deepEqual(side.messages.map(m => m.message), ['side error'])
    engine.execute = async () => ({ messages: [{ command: 'Result', from: 'Execute' }], binaryMessages: [] })
    await assert.rejects(client.execute({ 'v1.part.box': [{}] }), /empty Result for Execute v1\.part\.box/)
    engine.execute = real

    // 2. crashed (worker gone): the next command runs on a new engine.
    engine.close('simulated crash')
    assert.equal(await partCount(), 0, 'new engine, empty drawing')
    assert.notEqual(client.localEngine, engine)
    assert.ok(logs.some(l => /simulated crash/.test(l)))

    // 3. hung: the request timeout retires it instead of fencing the session.
    const hung = client.localEngine
    hung.execute = () => new Promise(() => {})
    await assert.rejects(client.execute({ 'v1.part.create': [{ name: 'B' }] }), /timeout/i)
    assert.equal(hung.closed, true)
    assert.equal((await client.execute({ 'v1.part.create': [{ name: 'C' }] })).maxLevel, 0, 'the next command runs on a new engine')
    assert.notEqual(client.localEngine, hung)

    // 4. wedged (alive but not answering the health check): use_session replaces it.
    const wedged = client.localEngine
    wedged.ping = async () => false
    await client.reconnect(null, 'wasm')
    assert.notEqual(client.localEngine, wedged)
    assert.equal(wedged.closed, true)
    assert.equal(await partCount(), 0)
    // …a healthy one is kept, drawing included.
    await client.execute({ 'v1.part.create': [{ name: 'D' }] })
    const healthy = client.localEngine
    await client.reconnect(null, 'wasm')
    assert.equal(client.localEngine, healthy)
    assert.equal(await partCount(), 1)
  } finally {
    client.close()
  }
})

test('no OFB export: save and scripts refuse it, STEP and checkpoint/restore still work', async () => {
  const a = shim({
    CLASSCAD_MCP_PORT: String(await freePort()),
    CLASSCAD_BRIDGE_LISTEN: `ws://127.0.0.1:${await freePort()}/bridge`,
    CLASSCAD_WS_URL: `ws://127.0.0.1:${await freePort()}/`,
    CLASSCAD_DAEMON_IDLE_MS: '1500',
    CLASSCAD_ENGINE: 'wasm',
  })
  try {
    await a.init()
    assert.ok(!(await a.tool('run_script', { script: `const p = (await api.v1.part.create({ name: 'O' })).result; await api.v1.part.box({ id: p, length: 10, width: 20, height: 30 }); return p` })).isError)
    // scripts: the default format, explicit OFB, and exportNode
    for (const call of ['api.v1.common.save({})', "api.v1.common.save({ format: 'OFB', encoding: 'base64' })", 'api.v1.assembly.exportNode({ id: 4 })']) {
      const r = await a.tool('run_script', { script: `return await ${call}` })
      assert.ok(r.isError && /OFB export is not available/.test(r.text), `${call}: ${r.text}`)
    }
    // the save tool no longer offers OFB
    const tool = await a.call('tools/call', { name: 'save', arguments: { format: 'OFB' } })
    assert.ok(tool.error || tool.result?.isError, 'save({ format: OFB }) is rejected: ' + JSON.stringify(tool).slice(0, 200))
    // STEP export still works
    const stp = (await a.tool('save', { format: 'STP' })).value
    assert.ok(stp.success && stp.bytes > 0, 'STEP export: ' + JSON.stringify(stp).slice(0, 200))
    // checkpoint/restore still use OFB internally, without handing it out
    const cp = await a.tool('checkpoint', { label: 'before' })
    assert.ok(!cp.isError && !/classcad\\nVersion/.test(cp.text) && cp.text.length < 400, 'checkpoint returns no model data: ' + cp.text)
    await a.tool('run_script', { script: `await api.v1.common.clear(); return 1` })
    assert.ok(!(await a.tool('restore', { label: 'before' })).isError)
    const vol = await a.tool('run_script', { script: `const t = await api.tree(); const p = Object.values(t).find(n => n.class === 'CC_Part'); return (await api.v1.part.calculateMassProperties({ id: p.id })).result.volume` })
    assert.equal(vol.value?.returned, 6000, 'restored box: ' + vol.text)
  } finally {
    await a.exit()
  }
})

test('local engine: clear, restore and deletions leave no stale geometry in the graphic', async () => {
  const a = shim({
    CLASSCAD_MCP_PORT: String(await freePort()),
    CLASSCAD_BRIDGE_LISTEN: `ws://127.0.0.1:${await freePort()}/bridge`,
    CLASSCAD_WS_URL: `ws://127.0.0.1:${await freePort()}/`,
    CLASSCAD_DAEMON_IDLE_MS: '1500',
    CLASSCAD_ENGINE: 'wasm',
  })
  // triangles per container, and the bounds of everything the renderer would draw
  const graphic = `const g = await api.graphic(); const cs = (g?.containers ?? []).filter(c => (c.meshes ?? []).length);
    const cap = await api.inspect.capture(); const b = api.inspect.graphicBounds(cap, api.inspect.currentSolids(cap));
    return { withMeshes: cs.length, size: b ? b.max.map((v, i) => Math.round(v - b.min[i])) : null }`
  const state = async () => (await a.tool('run_script', { script: graphic })).value?.returned
  try {
    await a.init()
    await a.tool('run_script', { script: `const p = (await api.v1.part.create({ name: 'OldBox' })).result; await api.v1.part.box({ id: p, length: 100, width: 100, height: 100 }); return p` })
    const box = await state()
    assert.equal(box.withMeshes, 1, 'the live box is in the graphic (pruning keeps live geometry): ' + JSON.stringify(box))
    assert.deepEqual(box.size, [100, 100, 100])

    // clear → nothing left to draw
    assert.ok(!(await a.tool('clear')).isError)
    const cleared = await a.tool('run_script', { script: `const g = await api.graphic(); return (g?.containers ?? []).length` })
    assert.equal(cleared.value?.returned, 0, 'no containers after clear: ' + cleared.text)

    // a new model after clear shows only itself
    await a.tool('run_script', { script: `const p = (await api.v1.part.create({ name: 'NewCyl' })).result; await api.v1.part.cylinder({ id: p, diameter: 20, height: 50 }); return p` })
    const cyl = await state()
    assert.equal(cyl.withMeshes, 1, 'only the cylinder: ' + JSON.stringify(cyl))
    assert.deepEqual(cyl.size, [20, 20, 50], 'the old box is not in the picture')

    // restore brings back the checkpoint's geometry, not what came after it
    await a.tool('checkpoint', { label: 'cyl' })
    await a.tool('run_script', { script: `const t = await api.tree(); const p = Object.values(t).find(n => n.class === 'CC_Part'); await api.v1.part.box({ id: p.id, name: 'Extra', length: 200, width: 200, height: 200 }); return 1` })
    assert.deepEqual((await state()).size, [210, 210, 200], 'cylinder plus the extra box before restore')
    assert.ok(!(await a.tool('restore', { label: 'cyl' })).isError)
    const restored = await state()
    assert.deepEqual(restored.size, [20, 20, 50], 'after restore only the checkpointed cylinder: ' + JSON.stringify(restored))
  } finally {
    await a.exit()
  }
})

test('3D view: one link per session, live updates, exports, nothing shared between sessions', async () => {
  const { mkdtempSync, readFileSync, existsSync } = await import('node:fs')
  const { tmpdir } = await import('node:os')
  const env = {
    CLASSCAD_MCP_PORT: String(await freePort()),
    CLASSCAD_BRIDGE_LISTEN: `ws://127.0.0.1:${await freePort()}/bridge`,
    CLASSCAD_WS_URL: `ws://127.0.0.1:${await freePort()}/`,
    CLASSCAD_DAEMON_IDLE_MS: '1500',
    CLASSCAD_ENGINE: 'wasm',
  }
  const a = shim(env)
  const b = shim(env) // a second session in the same daemon
  const scene = async url => (await (await fetch(`${url}/scene`)).json())
  try {
    await a.init()
    await b.init()
    const ua = (await a.tool('session_info')).value.viewer
    const ub = (await b.tool('session_info')).value.viewer
    assert.match(ua, /^http:\/\/127\.0\.0\.1:\d+\/v\/[A-Za-z0-9_-]{16,}$/)
    assert.notEqual(ua, ub, 'each session has a link of its own')
    assert.equal(new URL(ua).origin, new URL(ub).origin, 'one listener for the daemon')

    // the page and what it loads
    const page = await fetch(ua)
    assert.equal(page.status, 200)
    assert.match(page.headers.get('content-security-policy') ?? '', /default-src 'self'/)
    assert.match(await page.text(), /viewer\.js/)
    for (const asset of ['viewer.js', 'viewer.css', 'vendor/three.module.min.js', 'vendor/addons/controls/OrbitControls.js', 'fonts/jetbrains-mono-latin.woff2']) {
      assert.equal((await fetch(`${new URL(ua).origin}/assets/${asset}`)).status, 200, asset)
    }

    // a look at an unused session shows an empty stage and starts no engine
    const empty = await scene(ua)
    assert.equal(empty.scene.kind, 'EMPTY')
    assert.equal((await a.tool('session_info')).value.wasm.running, false, 'looking does not start the engine')

    // the update stream of session A
    const stream = await fetch(`${ua}/events`)
    const reader = stream.body.getReader()
    let seen = ''
    const until = async (what, ms = 15000) => {
      const end = Date.now() + ms
      while (!seen.includes(what) && Date.now() < end) {
        const chunk = await Promise.race([reader.read(), new Promise(r => setTimeout(() => r(null), 500))])
        if (chunk?.value) seen += new TextDecoder().decode(chunk.value)
      }
      return seen.includes(what)
    }
    assert.ok(await until('event: hello'), 'the stream says hello')

    // a model in A: its result carries the link, its watchers are told, B sees nothing of it
    const built = await a.call('tools/call', { name: 'run_script', arguments: { script: `const p = (await api.v1.part.create({ name: 'Seen' })).result; await api.v1.part.cylinder({ id: p, diameter: 40, height: 20 }); return p` } })
    const texts = built.result.content.filter(c => c.type === 'text').map(c => c.text)
    assert.ok(texts.some(t => t.includes('3D view') && t.includes(ua)), 'the result offers the view: ' + texts.join(' | '))
    assert.ok(await until('event: scene'), 'watchers hear of the change')
    const one = await scene(ua)
    assert.equal(one.scene.name, 'Seen')
    assert.equal(one.scene.stats.bodies, 1)
    assert.deepEqual(one.scene.bounds.max.map((v, i) => Math.round(v - one.scene.bounds.min[i])), [40, 40, 20])
    assert.equal(one.scene.bodies[0].edges.length, 2, 'two circles: the cylinder\'s seam is not a line of the part')
    assert.equal(one.scene.features.length, 1)
    assert.equal(one.host, 'wasm-live')
    assert.equal((await scene(ub)).scene.kind, 'EMPTY', 'session B does not see session A\'s model')

    // B builds its own
    await b.tool('run_script', { script: `const p = (await api.v1.part.create({ name: 'Other' })).result; await api.v1.part.box({ id: p, length: 10, width: 20, height: 30 }); return p` })
    assert.equal((await scene(ub)).scene.name, 'Other')
    assert.equal((await scene(ua)).scene.name, 'Seen')

    // exports: from the page, and from the save tool to disk
    const stl = await fetch(`${ua}/export/Seen.stl`)
    assert.equal(stl.status, 200)
    assert.match(stl.headers.get('content-disposition') ?? '', /Seen\.stl/)
    assert.ok((await stl.arrayBuffer()).byteLength > 84, 'an STL with triangles')
    const glb = Buffer.from(await (await fetch(`${ua}/export/Seen.glb`)).arrayBuffer())
    assert.equal(glb.toString('latin1', 0, 4), 'glTF')
    assert.equal(glb.readUInt32LE(8), glb.length, 'the GLB\'s length field is its length')
    const gltf = JSON.parse(glb.toString('utf8', 20, 20 + glb.readUInt32LE(12)))
    assert.equal(gltf.meshes.length, 1)
    const dir = mkdtempSync(join(tmpdir(), 'classcad-save-'))
    for (const [format, ext] of [['STP', 'stp'], ['GLB', 'glb']]) {
      const saved = (await a.tool('save', { format, path: join(dir, 'sub', `seen.${ext}`) })).value
      assert.ok(saved.success && saved.bytes > 0 && !('content' in saved), `${format} to disk: ${JSON.stringify(saved)}`)
      assert.ok(existsSync(saved.path) && readFileSync(saved.path).length === saved.bytes)
    }
    assert.ok((await a.tool('save', { format: 'STP', path: 'relative.stp' })).isError, 'a relative path is refused')

    // the view tool hands out the same link
    assert.ok((await a.tool('view', { open: false })).text.includes(ua))

    // clear empties the view
    await a.tool('clear')
    assert.equal((await scene(ua)).scene.bodies.length, 0)

    // only the link opens the view
    assert.equal((await fetch(`${new URL(ua).origin}/v/${'A'.repeat(24)}/scene`)).status, 404)
    const foreign = await new Promise((resolve, reject) => {
      const u = new URL(`${ua}/scene`)
      import('node:http').then(({ request }) => request({ host: u.hostname, port: u.port, path: u.pathname, headers: { host: 'evil.example' } }, res => resolve(res.statusCode)).on('error', reject).end())
    })
    assert.equal(foreign, 403, 'another site\'s name for this address is refused')
    reader.cancel().catch(() => {})
  } finally {
    await a.exit()
    await b.exit()
  }
})
