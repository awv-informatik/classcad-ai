// Local WASM engine contract — LIVE: downloads the release assets on first
// run (~85 MB) and needs an engine key for http://localhost in
// CLASSCAD_WASM_KEY (a CI secret); without one these tests are skipped.
//   1. engine policy "wasm": the shim serves a session on the MCP's own engine
//      (no worker involved) — run_script, tree, snapshot work
//   2. policy "auto" with no worker reachable: falls back to the local engine
//   3. policy "drogon" with no worker: a clear error, no fallback
//   4. use_session(engine) switches at runtime
// And, each in a test of its own: engine errors and a crashed, hung or wedged
// engine; OFB out and in; the graphic after clear, restore and deletions; the
// read-only 3D view; sharing (an app docked into the MCP's engine, a second
// agent in the same session, files, a replaced engine); where the app comes up.
import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { fakeAuth } from './fake-auth.mjs'

// The engine starts only with a valid key; the MCP carries none any more. Without CLASSCAD_WASM_KEY
// (a key for http://localhost, a CI secret) these tests are skipped.
const live = process.env.CLASSCAD_WASM_KEY ? test : (name, fn) => test(name, { skip: 'set CLASSCAD_WASM_KEY to run the engine' }, fn)

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
  // A shim that is gone already has nothing left to say: waiting for its exit would wait forever.
  const exit = () => new Promise(r => { if (p.exitCode !== null || p.signalCode !== null) return r(); p.once('exit', r); p.stdin.end() })
  return { p, call, init, tool, exit, stderr: () => stderr.join('') }
}

live('local WASM engine through the MCP (policy wasm / auto fallback / drogon)', async () => {
  const deadWorker = `ws://127.0.0.1:${await freePort()}/`   // nothing listens here
  const base = {
    CLASSCAD_MCP_PORT: String(await freePort()),
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

live('auto: a worker that comes up later takes over an EMPTY local session, never a modeled one', async () => {
  const { startFakeWorker } = await import('../../script/test/fake-worker.mjs')
  const workerPort = await freePort()
  const env = {
    CLASSCAD_MCP_PORT: String(await freePort()),
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

live('engine errors surface through run_script (the WASM engine nests maxLevel/messages in result)', async () => {
  const a = shim({
    CLASSCAD_MCP_PORT: String(await freePort()),
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

live('local engine: frame guards, and a crashed / hung / wedged engine is replaced', async () => {
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

live('OFB: the save tool and a script write it, load reads it back with its features; checkpoint and restore', async () => {
  const { mkdtempSync } = await import('node:fs')
  const { tmpdir } = await import('node:os')
  const a = shim({
    CLASSCAD_MCP_PORT: String(await freePort()),
    CLASSCAD_WS_URL: `ws://127.0.0.1:${await freePort()}/`,
    CLASSCAD_DAEMON_IDLE_MS: '1500',
    CLASSCAD_ENGINE: 'wasm',
  })
  const volume = async () => (await a.tool('run_script', { script: `const t = await api.tree(); const p = Object.values(t).find(n => n.class === 'CC_Part'); return (await api.v1.part.calculateMassProperties({ id: p.id })).result.volume` })).value?.returned
  try {
    await a.init()
    assert.ok(!(await a.tool('run_script', { script: `const p = (await api.v1.part.create({ name: 'O' })).result; await api.v1.part.box({ id: p, length: 10, width: 20, height: 30, name: 'Block' }); return p` })).isError)
    // a script saves OFB like any other format
    const inline = await a.tool('run_script', { script: `const r = await api.v1.common.save({ format: 'OFB', encoding: 'base64' }); return typeof r.result?.content === 'string' && r.result.content.length > 100` })
    assert.equal(inline.value?.returned, true, 'common.save writes OFB from a script: ' + inline.text)
    // the save tool writes it to a file
    const file = join(mkdtempSync(join(tmpdir(), 'classcad-ofb-')), 'box.ofb')
    const saved = (await a.tool('save', { format: 'OFB', path: file })).value
    assert.ok(saved.success && saved.bytes > 100, 'save writes OFB: ' + JSON.stringify(saved).slice(0, 200))
    // ... and load brings the model back as it was: the part with its feature, not just a body
    await a.tool('clear')
    const loaded = await a.tool('load', { format: 'OFB', path: file })
    assert.ok(!loaded.isError && loaded.value.ok, 'load reads OFB: ' + loaded.text)
    assert.ok((await a.tool('tree')).value.nodes.some(node => node.name === 'Block'), 'the feature is back, by name')
    assert.equal(await volume(), 6000)
    // STEP export
    const stp = (await a.tool('save', { format: 'STP' })).value
    assert.ok(stp.success && stp.bytes > 0, 'STEP export: ' + JSON.stringify(stp).slice(0, 200))
    // checkpoint/restore keep their copy in the MCP's process: nothing of the model comes back in the answer
    const cp = await a.tool('checkpoint', { label: 'before' })
    assert.ok(!cp.isError && !/classcad\\nVersion/.test(cp.text) && cp.text.length < 400, 'checkpoint returns no model data: ' + cp.text)
    await a.tool('run_script', { script: `await api.v1.common.clear(); return 1` })
    assert.ok(!(await a.tool('restore', { label: 'before' })).isError)
    assert.equal(await volume(), 6000, 'restored box')
  } finally {
    await a.exit()
  }
})

live('load: a STEP file from disk by path, or base64 content, never both', async () => {
  const { mkdtempSync, readFileSync } = await import('node:fs')
  const { tmpdir } = await import('node:os')
  const a = shim({
    CLASSCAD_MCP_PORT: String(await freePort()),
    CLASSCAD_WS_URL: `ws://127.0.0.1:${await freePort()}/`,
    CLASSCAD_DAEMON_IDLE_MS: '1500',
    CLASSCAD_ENGINE: 'wasm',
  })
  const volume = async () => (await a.tool('run_script', { script: `const g = await api.graphic(); const cap = await api.inspect.capture(); const b = api.inspect.graphicBounds(cap, api.inspect.currentSolids(cap)); return b ? b.max.map((v, i) => Math.round(v - b.min[i])) : null` })).value?.returned
  try {
    await a.init()
    await a.tool('run_script', { script: `const p = (await api.v1.part.create({ name: 'L' })).result; await api.v1.part.box({ id: p, length: 10, width: 20, height: 30 }); return p` })
    const file = join(mkdtempSync(join(tmpdir(), 'classcad-load-')), 'box.stp')
    assert.ok((await a.tool('save', { format: 'STP', path: file })).value.success)

    // analytic STEP: the box's faces are written as planes, not as B-spline surfaces
    assert.ok(!/\bPLANE\(/.test(readFileSync(file, 'utf8')), 'default STEP export writes B-spline surfaces')
    const analytic = join(dirname(file), 'box-analytic.stp')
    assert.ok((await a.tool('save', { format: 'STP', path: analytic, analytic: true })).value.success)
    assert.ok(/\bPLANE\(/.test(readFileSync(analytic, 'utf8')) && !/B_SPLINE_SURFACE/.test(readFileSync(analytic, 'utf8')), 'analytic STEP export writes planes')

    // from disk: the drawing is replaced by the file's geometry
    await a.tool('clear')
    const loaded = await a.tool('load', { format: 'STP', path: file })
    assert.ok(!loaded.isError && loaded.value.ok, 'load by path: ' + loaded.text)
    assert.equal(loaded.value.bytes, readFileSync(file).length)
    assert.deepEqual(await volume(), [10, 20, 30], 'the loaded box')

    // base64 content still works
    await a.tool('clear')
    const inline = await a.tool('load', { format: 'STP', content: readFileSync(file).toString('base64') })
    assert.ok(!inline.isError && inline.value.ok, 'load by content: ' + inline.text)
    assert.deepEqual(await volume(), [10, 20, 30])

    // refusals
    assert.ok((await a.tool('load', { format: 'STP' })).isError, 'neither path nor content')
    assert.ok((await a.tool('load', { format: 'STP', path: file, content: 'x' })).isError, 'both path and content')
    assert.ok((await a.tool('load', { format: 'STP', path: 'relative.stp' })).isError, 'a relative path is refused')
    const missing = await a.tool('load', { format: 'STP', path: join(tmpdir(), 'classcad-no-such-file.stp') })
    assert.ok(missing.isError && /Cannot read/.test(missing.text), 'a missing file: ' + missing.text)
  } finally {
    await a.exit()
  }
})

live('local engine: clear, restore and deletions leave no stale geometry in the graphic', async () => {
  const a = shim({
    CLASSCAD_MCP_PORT: String(await freePort()),
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

live('read-only 3D view: one link per session, live updates, exports, nothing shared between sessions', async () => {
  const { mkdtempSync, readFileSync, existsSync } = await import('node:fs')
  const { tmpdir } = await import('node:os')
  const env = {
    CLASSCAD_MCP_PORT: String(await freePort()),
    CLASSCAD_WS_URL: `ws://127.0.0.1:${await freePort()}/`,
    CLASSCAD_DAEMON_IDLE_MS: '1500',
    CLASSCAD_ENGINE: 'wasm',
    // the view a build without the app has, asked for by name
    CLASSCAD_VIEWER: 'readonly',
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

live('sharing: an app docks into the MCP\'s own engine, and an agent joins another agent\'s session', async () => {
  const { default: WebSocket } = await import('ws')
  const { inflateRawSync } = await import('node:zlib')
  const listener = await freePort()
  const env = {
    CLASSCAD_MCP_PORT: String(await freePort()),
    CLASSCAD_WS_URL: `ws://127.0.0.1:${await freePort()}/`,
    CLASSCAD_DAEMON_IDLE_MS: '1500',
    CLASSCAD_ENGINE: 'wasm',
    CLASSCAD_VIEWER_PORT: String(listener),
    // an app that is hosted elsewhere: the link carries the invite, whatever this build carries
    CLASSCAD_APP_URL: 'http://app.test/',
  }
  const a = shim(env)
  const b = shim(env)
  const sleep = ms => new Promise(r => setTimeout(r, ms))
  let ws
  try {
    await a.init()
    const built = await a.call('tools/call', { name: 'run_script', arguments: { script: `const p = (await api.v1.part.create({ name: 'Shared' })).result; await api.v1.part.box({ id: p, length: 10, width: 20, height: 30, name: 'FromAgent' }); return p` } })
    const link = (await a.tool('session_info')).value.app
    assert.match(link, /^http:\/\/app\.test\/\?invite=[0-9a-f-]{36}$/, 'the app\'s link carries the session\'s invite')
    assert.ok(built.result.content.some(c => c.type === 'text' && c.text.includes(`App: ${link}`) && /Tell the user once that they can open the model there/.test(c.text)), 'the first model offers the app')
    const invite = new URL(link).searchParams.get('invite')
    const partId = JSON.parse(built.result.content[0].text).returned

    // ── an app: what buerli's WSClient does ──
    ws = new WebSocket(`ws://127.0.0.1:${listener}/session/?invite=${invite}`)
    const frames = []
    const waiters = new Map()
    let n = 0
    ws.on('message', (data, isBinary) => {
      const frame = JSON.parse(isBinary ? inflateRawSync(data).toString() : data.toString())
      frames.push(frame)
      if (frame.command === 'Result' && waiters.has(frame._transactionID_)) { waiters.get(frame._transactionID_)(frame); waiters.delete(frame._transactionID_) }
    })
    await new Promise((resolve, reject) => { ws.once('open', resolve); ws.once('error', reject) })
    const send = cmd => new Promise(resolve => { const transactionID = `app-${++n}`; waiters.set(transactionID, resolve); ws.send(JSON.stringify({ commandVersion: 'v1', transactionID, ...cmd })) })
    const presence = (channel, data) => ws.send(JSON.stringify({ command: 'Presence', channel, data }))
    const config = await send({ command: 'SetEmissionConfig', config: { sendStructure: true, sendStructure_Patch: true, sendStructure_Immediately: true, sendGraphic_Kernel: true, sendGraphic_Immediately: true, sendGraphic_ImmediatelyBinary: true, sendMessages: true } })
    assert.equal(config.result.sendStructure_Patch, true)
    assert.equal(frames[0].command, 'SessionJoined')
    presence('client', { app: 'testapp', version: '1.0', kind: 'app' })
    const tree = await send({ command: 'GetTree' })
    const names = Object.values(tree.structure.tree).map(node => node.name)
    assert.ok(names.includes('Shared') && names.includes('FromAgent'), 'the guest sees the model that was already there')
    assert.ok(tree.graphic.containers.some(c => (c.meshes ?? []).length === 6), 'with the box\'s six faces')
    const face = tree.graphic.containers.find(c => (c.meshes ?? []).length === 6)

    // the host said who it is, and keeps no format from its guests: without a word on 'config' an app offers them all
    for (let i = 0; i < 40 && !frames.some(f => f.command === 'Presence' && f.channel === 'client'); i++) await sleep(25)
    assert.ok(!frames.some(f => f.command === 'Presence' && f.channel === 'config'), 'no restriction is published')
    assert.deepEqual(frames.find(f => f.command === 'Presence' && f.channel === 'client').data, { app: 'classcad-mcp', version: frames.find(f => f.command === 'Presence' && f.channel === 'client').data.version, kind: 'agent', name: 'wasm-live' })

    // the agent builds: the app is sent the change as it happens
    frames.length = 0
    const again = await a.tool('run_script', { script: `await api.v1.part.cylinder({ id: ${partId}, diameter: 5, height: 50, name: 'Pin' }); return 1` })
    assert.ok(!again.isError)
    assert.ok(!again.content.some(c => c.type === 'text' && c.text.includes(link)), 'the app is offered once: later results do not repeat its link')
    for (let i = 0; i < 40 && !frames.some(f => f.command === 'Graphic'); i++) await sleep(25)
    assert.ok(frames.some(f => f.command === 'StructurePatch' && JSON.stringify(f.structurePatch).includes('Pin')), 'a structure patch with the new feature')
    assert.ok(frames.some(f => f.command === 'Graphic' && f.graphic.containers.length), 'and its graphic')

    // the user builds: the agent reads it
    const made = await send({ command: 'Execute', task: [{ 'v1.part.box': [{ id: partId, length: 1, width: 2, height: 3, name: 'FromApp' }] }], options: { undoable: true } })
    assert.ok(typeof made.result === 'number' && (made.maxLevel ?? 0) < 51, 'a guest\'s command runs on the MCP\'s engine: ' + JSON.stringify(made).slice(0, 200))
    assert.ok((await a.tool('tree')).value.nodes.some(node => node.name === 'FromApp'), 'the agent\'s next look at the tree has the user\'s feature')
    const shown = await a.tool('snapshot', {})
    assert.ok(shown.content.some(block => block.type === 'image'), 'and its render works on')

    // a guest saves what the host may save: OFB too (the app's File menu)
    const ofb = await send({ command: 'Execute', task: [{ 'v1.common.save': [{ format: 'OFB', encoding: 'base64' }] }] })
    assert.ok((ofb.maxLevel ?? 0) < 51 && ofb.result?.content?.length > 100, 'a guest saves OFB: ' + JSON.stringify(ofb).slice(0, 200))

    // pointing, both ways
    presence('selection', { items: [{ kind: 'face', objectId: face.owner, prodRefId: partId, containerId: face.id, graphicId: face.meshes[0].id, type: 'plane' }], total: 1 })
    await send({ command: 'GetEmissionConfig' })
    const selection = (await a.tool('get_selection')).value
    assert.equal(selection.count, 1)
    assert.equal(selection.selections[0].who, 'testapp (user)')
    assert.equal(selection.selections[0].items[0].graphicId, face.meshes[0].id)
    assert.equal(selection.selections[0].items[0].object.class, 'CC_Solid', 'the tree\'s word on the picked object')
    frames.length = 0
    const asked = await a.tool('set_selection', { items: [{ graphicId: face.meshes[1].id }] })
    assert.ok(!asked.isError, asked.text)
    const selects = frames.filter(f => f.command === 'Presence' && f.channel === 'select')
    assert.equal(selects.length, 2, 'the request, then the note that it is over')
    assert.deepEqual(selects[0].data.items, [{ graphicId: face.meshes[1].id }])
    assert.deepEqual(selects[1].data, { id: selects[0].data.id, done: true })
    const info = (await a.tool('session_info')).value
    assert.deepEqual(info.peers, [{ app: 'testapp', name: 'user', kind: 'app', role: 'edit' }])
    assert.match((await a.tool('view')).text, /already has it open: nothing was opened/, 'an app that is docked is not opened once more')

    // ── another agent joins the session with the same link ──
    await b.init()
    const joined = await b.tool('use_session', { url: link })
    assert.ok(!joined.isError, 'the link of an agent\'s session is joined on this machine: ' + joined.text)
    assert.equal(joined.value.transport, 'ws')
    const treeB = (await b.tool('tree')).value
    assert.ok(treeB.nodes.some(node => node.name === 'FromApp'), 'the second agent sees the model')
    assert.ok(!(await b.tool('run_script', { script: `const t = await api.tree(); const p = Object.values(t).find(n => n.class === 'CC_Part'); await api.v1.part.box({ id: p.id, length: 4, width: 4, height: 4, name: 'FromB' }); return 1` })).isError)
    assert.ok((await b.tool('snapshot', {})).content.some(block => block.type === 'image'), 'and renders it')
    assert.ok((await a.tool('tree')).value.nodes.some(node => node.name === 'FromB'), 'the first agent sees what the second built')
    assert.ok((await a.tool('session_info')).value.peers.some(peer => peer.kind === 'agent' && peer.app === 'classcad-mcp'), 'and that it is there')
    assert.match((await b.tool('view', { open: false })).text, /belongs to an app the user already has open|There is nothing else to open/, 'a guest has no app of its own to offer')

    // the session ends: its guests are closed
    const closed = new Promise(resolve => ws.once('close', resolve))
    await a.exit()
    await closed
  } finally {
    try { ws?.close() } catch {}
    try { a.p.kill() } catch {}
    await b.exit()
  }
})

live('sharing on the real engine: a guest saves and opens a file, sessions stay apart, a replaced engine is sent anew', async () => {
  // The listener asks whether the machine is signed in: set that up before it is loaded.
  Object.assign(process.env, AUTH)
  const { connect } = await import('../dist/client.js')
  const { wasmOptionsFromEnv } = await import('../dist/engine/wasm.js')
  const { createSessionHub } = await import('../dist/share/hub.js')
  const { listen, offerInvite } = await import('../dist/share/server.js')
  const { default: WebSocket } = await import('ws')
  const { inflateRawSync } = await import('node:zlib')
  const sleep = ms => new Promise(r => setTimeout(r, ms))
  const { port } = await listen()
  // What mcp-server.ts makes of a session, without the tools: an engine client, its hub, an invite.
  const session = async () => {
    const client = await connect(`ws://127.0.0.1:${await freePort()}/`, { engine: 'wasm', wasm: wasmOptionsFromEnv(), requestTimeoutMs: 20_000 })
    const hub = createSessionHub({ client, queue: work => work(), toHost: () => {} })
    const invite = hub.createInvite('edit', 'app')
    const unoffer = offerInvite(invite.invite, hub)
    return { client, hub, invite: invite.invite, end: () => { unoffer(); hub.close(); client.close() } }
  }
  // An app: connects, asks for streaming, like buerli's WSClient.
  const app = async invite => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}/session/?invite=${invite}`)
    const frames = []
    const waiters = new Map()
    let n = 0
    ws.on('message', (data, isBinary) => {
      const frame = JSON.parse(isBinary ? inflateRawSync(data).toString() : data.toString())
      frames.push(frame)
      if (frame.command === 'Result' && waiters.has(frame._transactionID_)) { waiters.get(frame._transactionID_)(frame); waiters.delete(frame._transactionID_) }
    })
    await new Promise((resolve, reject) => { ws.once('open', resolve); ws.once('error', reject) })
    const send = cmd => new Promise(resolve => { const transactionID = `app-${++n}`; waiters.set(transactionID, resolve); ws.send(JSON.stringify({ commandVersion: 'v1', transactionID, ...cmd })) })
    await send({ command: 'SetEmissionConfig', config: { sendStructure: true, sendStructure_Patch: true, sendGraphic_Kernel: true, sendGraphic_ImmediatelyBinary: true } })
    return { ws, frames, send }
  }
  const one = await session()
  const two = await session()
  let g
  try {
    const p1 = (await one.client.execute({ 'v1.part.create': [{ name: 'One' }] })).result
    await one.client.execute({ 'v1.part.box': [{ id: p1, length: 10, width: 20, height: 30 }] })
    const p2 = (await two.client.execute({ 'v1.part.create': [{ name: 'Two' }] })).result
    g = await app(one.invite)

    // A file out and a file in: exactly what the app's "Save as" and "Open" send.
    const stp = await g.send({ command: 'Execute', task: [{ 'v1.common.save': [{ format: 'STP', encoding: 'base64' }] }], options: { undoable: false } })
    assert.ok((stp.maxLevel ?? 0) < 51 && stp.result?.content?.length > 1000, 'a guest saves STEP: ' + JSON.stringify(stp).slice(0, 200))
    assert.match(Buffer.from(stp.result.content, 'base64').toString('latin1', 0, 40), /ISO-10303-21/)
    const opened = await g.send({ command: 'Execute', task: [{ 'v1.common.load': [{ data: stp.result.content, encoding: 'base64', format: 'STP', doClear: true }] }], options: { undoable: false } })
    assert.ok((opened.maxLevel ?? 0) < 51, 'a guest opens a file in the session: ' + JSON.stringify(opened).slice(0, 300))
    const tree = await one.client.getTree()
    assert.ok(!Object.values(tree).some(node => node.class === 'CC_Box'), 'the file took the place of the model: the host\'s tree has no box feature any more')
    const bodies = ((await one.client.getGraphic())?.containers ?? []).filter(c => (c.meshes ?? []).length)
    assert.equal(bodies.length, 1, 'and its graphic shows the loaded body, once: ' + bodies.length)
    assert.equal(bodies[0].meshes.length, 6)

    // Two sessions on one listener: a guest of one hears nothing of the other. (A question of its
    // own first and last: frames come in order, so whatever was under way has arrived by then.)
    await g.send({ command: 'GetEmissionConfig' })
    g.frames.length = 0
    await two.client.execute({ 'v1.part.cylinder': [{ id: p2, diameter: 5, height: 5 }] })
    await sleep(150)
    await g.send({ command: 'GetEmissionConfig' })
    assert.deepEqual(g.frames.map(f => f._from_), ['GetEmissionConfig'], 'nothing of another session reaches this guest: ' + JSON.stringify(g.frames).slice(0, 400))

    // The engine is replaced (a crash): its drawing is empty, and the guest is sent the model anew.
    one.client.localEngine.close('simulated crash')
    await one.client.execute({ 'v1.part.create': [{ name: 'Again' }] })
    for (let i = 0; i < 40 && !g.frames.some(f => f.command === 'Result' && f._from_ === 'GetTree'); i++) await sleep(25)
    const resync = g.frames.find(f => f.command === 'Result' && f._from_ === 'GetTree')
    assert.ok(resync?.structure?.tree && Array.isArray(resync.graphic?.containers), 'a pull nobody asked for: the new engine\'s structure and graphic')
    const now = await g.send({ command: 'GetTree' })
    const names = Object.values(now.structure.tree).map(node => node.name)
    assert.ok(names.includes('Again'), 'the guest is on the new engine\'s model')
    assert.equal(now.graphic.containers.filter(c => (c.meshes ?? []).length).length, 0, 'with nothing left of the old one')
  } finally {
    try { g?.ws.close() } catch {}
    one.end()
    two.end()
  }
})

live('the app is offered once, where the host shows it: its own browser pane, or the user\'s browser', async () => {
  const env = {
    CLASSCAD_MCP_PORT: String(await freePort()),
    CLASSCAD_WS_URL: `ws://127.0.0.1:${await freePort()}/`,
    CLASSCAD_DAEMON_IDLE_MS: '1500',
    CLASSCAD_ENGINE: 'wasm',
    CLASSCAD_VIEWER_PORT: String(await freePort()),
    CLASSCAD_APP_URL: 'http://app.test/',
  }
  // Two hosts on one daemon: the Claude desktop app (it has a browser pane beside the conversation) and a terminal.
  const desktop = shim({ ...env, CLAUDE_CODE_ENTRYPOINT: 'claude-desktop' })
  const terminal = shim({ ...env, CLAUDE_CODE_ENTRYPOINT: 'cli' })
  const texts = r => r.content.filter(c => c.type === 'text').map(c => c.text)
  const make = `const p = (await api.v1.part.create({ name: 'P' })).result; await api.v1.part.box({ id: p, length: 1, width: 2, height: 3 }); return p`
  const more = `const t = await api.tree(); const p = Object.values(t).find(n => n.class === 'CC_Part'); await api.v1.part.box({ id: p.id, length: 4, width: 5, height: 6 }); return 1`
  try {
    // What each agent knows from its first turn on: showing the app is the desktop agent's job, the terminal's opens by itself.
    const told = (await desktop.init()).result.instructions
    assert.ok(/SHOWING IT IS YOUR JOB HERE/.test(told) && /`preview_start`, the Browser pane tool/.test(told), 'the desktop agent is told that it opens the app, and with which tool')
    const toldTerminal = (await terminal.init()).result.instructions
    assert.ok(/it opens by itself in the user's default browser/.test(toldTerminal) && !/browser pane/.test(toldTerminal), 'the terminal agent is told nothing of panes')
    const link = (await desktop.tool('session_info')).value.app
    const first = texts(await desktop.tool('run_script', { script: make }))
    assert.ok(first.some(t => t.includes(`App: ${link}`) && /the user does not see it yet/.test(t) && /in your own browser pane/.test(t) && /preview_start/.test(t)), 'the agent is told to open the app in its own pane: ' + first.join(' | ').slice(0, 400))
    assert.ok(!texts(await desktop.tool('run_script', { script: more })).some(t => t.includes(link)), 'said once: the next result does not repeat the link')
    assert.ok(!texts(await desktop.tool('snapshot', {})).some(t => t.includes(link)), 'nor does a render')
    assert.match((await desktop.tool('view')).text, /open this link now in your own browser pane/, 'asked for, the link comes with the same instruction')

    // The other host of the same daemon: there the MCP opens the user's browser (in a test there is none: the link is handed over).
    const other = texts(await terminal.tool('run_script', { script: make }))
    assert.ok(other.some(t => /Tell the user once that they can open the model there/.test(t)) && !other.some(t => /browser pane/.test(t)), 'how the app is shown is the session\'s, not the daemon\'s: ' + other.join(' | ').slice(0, 300))
    assert.match((await terminal.tool('view', { open: false })).text, /Nothing was opened: give the user this link/)
    assert.ok(!texts(await terminal.tool('run_script', { script: more })).some(t => t.includes('App:')), 'after view handed the link over, it is not offered again')
  } finally {
    await desktop.exit()
    await terminal.exit()
  }
})
