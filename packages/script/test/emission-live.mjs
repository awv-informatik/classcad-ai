// Live counterpart of emission.mjs against a real worker. Skips (exit 0) when
// no worker is reachable — set CLASSCAD_URL to point at one (default
// ws://localhost:9094/). Pins the properties the fake worker only emulates:
// the REAL engine honors per-request config, and one GetTree pull carries
// both structure and graphic.
import { strict as assert } from 'node:assert'
import WebSocket from 'ws'
import { connectSession } from '../dist/session-node.js'

const url = process.env.CLASSCAD_URL ?? 'ws://localhost:9094/'
const reachable = await new Promise(r => {
  const ws = new WebSocket(url)
  const t = setTimeout(() => { ws.terminate(); r(false) }, 1500)
  ws.once('open', () => { clearTimeout(t); ws.close(); r(true) })
  ws.once('error', () => { clearTimeout(t); r(false) })
})
if (!reachable) {
  console.log(`emission-live: SKIP (no worker at ${url})`)
  process.exit(0)
}

// Count every outgoing frame of this process.
const sent = []
const origSend = WebSocket.prototype.send
WebSocket.prototype.send = function (data, ...rest) {
  try { sent.push(JSON.parse(data)) } catch {}
  return origSend.call(this, data, ...rest)
}

const s = await connectSession(url)
const u = r => (r.result && typeof r.result === 'object' && 'result' in r.result ? r.result.result : r.result)
try {
  const partId = u(await s.execute({ 'v1.part.create': [{ name: 'EmissionLive' }] }))
  const tree0 = await s.getTree()
  const topPl = Object.values(tree0).find(n => n.class === 'CC_WorkPlane' && n.name === 'Top').id
  const sk = u(await s.execute({ 'v1.sketch.create': [{ id: partId, planeId: topPl, name: 'S' }] }))
  const pts = [[0, 0], [30, 0], [30, 20], [0, 20]]
  const lines = u(await s.execute({ 'v1.sketch.line': [pts.map((q, i) => ({ id: sk, startPos: [q[0], q[1], 0], endPos: [...pts[(i + 1) % 4], 0] }))] }))
  const ext = await s.execute({ 'v1.part.extrusion': [{ id: partId, name: 'Ex', references: lines, type: 'UP', limit2: 8 }] })

  // 1. the real engine honored the suppression on a mutation
  assert.equal(ext.structure, undefined, 'suppressed Result carries no structure')
  assert.equal(ext.graphic, null, 'suppressed Result carries no graphic')
  assert.ok(Array.isArray(ext.messages), 'messages still present')

  // 2. one pull → both caches, from the real engine
  const pullsBefore = sent.filter(f => f.command === 'GetTree').length
  const g = await s.getGraphic()
  const tree = await s.getTree()
  assert.ok(g?.containers?.some(c => c.meshes?.length > 0), 'graphic pulled with meshes')
  assert.ok(Object.values(tree).some(n => n.class === 'CC_Extrusion' || /Extrusion/.test(n.class)), 'tree pulled with the extrusion')
  assert.equal(sent.filter(f => f.command === 'GetTree').length, pullsBefore + 1, 'graphic();tree() = exactly one GetTree')

  // 3. no payload frames streamed at any point (bundled delivery)
  const err = await s.execute({ 'v1.part.updateFillet': [{ id: 999999, radius: 6 }] })
  assert.ok(err.maxLevel >= 50 && err.messages.length > 0, 'engine errors surface on suppressed Results')
  console.log('emission-live: OK', { frames: sent.length, pulls: sent.filter(f => f.command === 'GetTree').length })
} finally {
  s.close()
}
