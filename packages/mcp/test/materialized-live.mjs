// Materialized instances — LIVE against a real worker (CLASSCAD_URL, default ws://localhost:9094/);
// skips (exit 0) when none is reachable. calculateMassProperties on an instance gives every instance
// its own geometryIdList, which an OFB reopens as [0] (invisible in the apps). The MCP flags it:
//   1. run_script that materializes instances → `warnings` in its result
//   2. save OFB of such a drawing → `warning`
//   3. after re-creating the instances in place: no warning, no geometryIdList
import { strict as assert } from 'node:assert'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import WebSocket from 'ws'
import { fakeAuth } from './fake-auth.mjs'
import { conversation } from './conversation.mjs'

const url = process.env.CLASSCAD_URL ?? 'ws://localhost:9094/'
const reachable = await new Promise(r => {
  const ws = new WebSocket(url)
  const t = setTimeout(() => { ws.terminate(); r(false) }, 1500)
  ws.once('open', () => { clearTimeout(t); ws.close(); r(true) })
  ws.once('error', () => { clearTimeout(t); r(false) })
})
if (!reachable) {
  console.log(`mcp materialized-live: SKIP (no worker at ${url})`)
  process.exit(0)
}

const SERVER = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'server.js')
const freePort = () => new Promise(r => { const s = createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)) }) })
const env = { ...process.env, ...(await fakeAuth()).env, CLASSCAD_ENGINE: 'drogon', CLASSCAD_WS_URL: url, CLASSCAD_MCP_PORT: String(await freePort()), CLASSCAD_DAEMON_IDLE_MS: '1500' }
const p = spawn(process.execPath, [SERVER], { env, stdio: ['pipe', 'pipe', 'pipe'] })
let buf = '', n = 0
const waiters = new Map()
p.stdout.on('data', d => { buf += d; let i; while ((i = buf.indexOf('\n')) >= 0) { const line = buf.slice(0, i); buf = buf.slice(i + 1); try { const m = JSON.parse(line); if (m.id != null && waiters.has(m.id)) { waiters.get(m.id)(m); waiters.delete(m.id) } } catch {} } })
const call = (method, params) => new Promise((resolve, reject) => { const id = ++n; const timer = setTimeout(() => reject(new Error('timeout ' + method)), 120000); waiters.set(id, m => { clearTimeout(timer); resolve(m) }); p.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n') })
const conv = conversation(); const tool = async (name, args = {}) => { const m = await call('tools/call', { name, arguments: conv.args(name, args) }); conv.saw(m); const t = (m.result?.content || []).find(b => b.type === 'text')?.text; let value; try { value = JSON.parse(t) } catch { value = t } return { isError: !!m.result?.isError, text: t, value } }
const dir = mkdtempSync(join(tmpdir(), 'classcad-materialized-'))

try {
  await call('initialize', { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'materialized-live', version: '0' } })
  p.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n')
  await tool('clear')
  const build = await tool('run_script', { script: `
    const asm = (await api.v1.assembly.create({ name: 'Probe' })).result
    const A = (await api.v1.assembly.partTemplate({ name: 'A' })).result
    await api.v1.part.box({ id: A, length: 40, width: 30, height: 20 })
    const B = (await api.v1.assembly.partTemplate({ name: 'B' })).result
    await api.v1.part.cylinder({ id: B, diameter: 20, height: 50 })
    await api.v1.assembly.setCurrentProduct({ id: asm })
    await api.v1.assembly.instance({ productId: A, ownerId: asm, name: 'A1' })
    await api.v1.assembly.instance({ productId: A, ownerId: asm, name: 'A2', transformation: [[100, 0, 0], [1, 0, 0], [0, 1, 0]] })
    await api.v1.assembly.instance({ productId: B, ownerId: asm, name: 'B1', transformation: [[0, 100, 0], [1, 0, 0], [0, 1, 0]] })
    await api.v1.assembly.calculateMassProperties({ id: asm }) // the root: harmless
    return asm` })
  assert.ok(!build.isError && !build.value.warnings, 'building and measuring the root warns nothing: ' + build.text)

  const measure = await tool('run_script', { script: `
    const t = await api.tree({ refresh: true })
    const a1 = Object.values(t).find(n => n.class === 'CC_ProductReference' && n.name === 'A1')
    return (await api.v1.assembly.calculateMassProperties({ id: a1.id })).result.volume` })
  assert.ok(!measure.isError, measure.text)
  assert.match(measure.value.warnings?.[0] ?? '', /materialized 3 instance\(s\)/, 'measuring one instance materializes all three: ' + measure.text)

  const again = await tool('run_script', { script: 'return 1' })
  assert.ok(!again.value.warnings, 'the warning comes once, from the script that materialized: ' + again.text)

  const saved = await tool('save', { format: 'OFB', path: join(dir, 'materialized.ofb') })
  assert.ok(!saved.isError && /3 instance\(s\) are materialized/.test(saved.value.warning ?? ''), 'save OFB warns: ' + saved.text)
  const stp = await tool('save', { format: 'STP', path: join(dir, 'materialized.stp') })
  assert.ok(!stp.value.warning, 'STEP carries no instance state, no warning: ' + stp.text)

  const repair = await tool('run_script', { script: `
    const t = await api.tree({ refresh: true }), all = Object.values(t)
    for (const owner of all.filter(n => n.class === 'CC_Assembly' || n.class === 'CC_AssemblyRoot')) {
      const rows = (owner.instances ?? []).map(id => t[id])
      if (!rows.some(n => n.geometryIdList)) continue
      await api.v1.assembly.deleteInstance({ ids: rows.map(n => n.id) })
      for (const n of rows) await api.v1.assembly.instance({ productId: n.members.productId.value, ownerId: owner.id,
        transformation: n.coordinateSystem.slice(0, 3), name: n.name })
    }
    return Object.values(await api.tree({ refresh: true })).filter(n => n.class === 'CC_ProductReference' && n.geometryIdList).length` })
  assert.equal(repair.value.returned, 0, 'repaired in place: ' + repair.text)
  assert.ok(!repair.value.warnings, repair.text)
  const clean = await tool('save', { format: 'OFB', path: join(dir, 'repaired.ofb') })
  assert.ok(!clean.isError && !clean.value.warning, 'the repaired drawing saves without a warning: ' + clean.text)

  const reload = await tool('load', { format: 'OFB', path: join(dir, 'repaired.ofb') })
  assert.ok(reload.value.ok, reload.text)
  const after = await tool('run_script', { script: 'return Object.values(await api.tree({ refresh: true })).filter(n => n.class === "CC_ProductReference").map(n => [n.name, !!n.geometryIdList])' })
  assert.deepEqual(after.value.returned.sort(), [['A1', false], ['A2', false], ['B1', false]], 'reopened: every instance draws from its template')
  console.log('mcp materialized-live: ok')
} finally {
  p.stdin.end()
  p.kill()
  rmSync(dir, { recursive: true, force: true })
}
