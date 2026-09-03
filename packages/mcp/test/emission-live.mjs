// Live counterpart of emission.mjs for the MCP client against a real worker.
// Skips (exit 0) when no worker is reachable (CLASSCAD_URL, default
// ws://localhost:9094/).
import { strict as assert } from 'node:assert'
import WebSocket from 'ws'
import { connect } from '../dist/client.js'

const url = process.env.CLASSCAD_URL ?? 'ws://localhost:9094/'
const reachable = await new Promise(r => {
  const ws = new WebSocket(url)
  const t = setTimeout(() => { ws.terminate(); r(false) }, 1500)
  ws.once('open', () => { clearTimeout(t); ws.close(); r(true) })
  ws.once('error', () => { clearTimeout(t); r(false) })
})
if (!reachable) {
  console.log(`mcp emission-live: SKIP (no worker at ${url})`)
  process.exit(0)
}

const sent = []
const origSend = WebSocket.prototype.send
WebSocket.prototype.send = function (data, ...rest) {
  try { sent.push(JSON.parse(data)) } catch {}
  return origSend.call(this, data, ...rest)
}

const c = await connect(url)
try {
  const partId = (await c.execute({ 'v1.part.create': [{ name: 'EmissionLiveMcp' }] })).result
  const tree0 = await c.getTree()
  const topPl = Object.values(tree0).find(n => n.class === 'CC_WorkPlane' && n.name === 'Top').id
  const sk = (await c.execute({ 'v1.sketch.create': [{ id: partId, planeId: topPl, name: 'S' }] })).result
  const pts = [[0, 0], [30, 0], [30, 20], [0, 20]]
  const lines = (await c.execute({ 'v1.sketch.line': [pts.map((q, i) => ({ id: sk, startPos: [q[0], q[1], 0], endPos: [...pts[(i + 1) % 4], 0] }))] })).result
  const ext = await c.execute({ 'v1.part.extrusion': [{ id: partId, name: 'Ex', references: lines, type: 'UP', limit2: 8 }] })
  assert.equal(ext.structure, null, 'suppressed Result carries no structure')
  assert.equal(ext.graphic, null, 'suppressed Result carries no graphic')

  const pullsBefore = sent.filter(f => f.command === 'GetTree').length
  const g = await c.getGraphic()
  const tree = await c.getTree()
  assert.ok(g?.containers?.some(x => x.meshes?.length > 0), 'graphic pulled with meshes')
  assert.ok(Object.values(tree).some(n => /Extrusion/.test(n.class)), 'tree pulled with the extrusion')
  assert.equal(sent.filter(f => f.command === 'GetTree').length, pullsBefore + 1, 'graphic();tree() = exactly one GetTree')
  assert.equal(sent.filter(f => f.command === 'Configuration').length, 0)

  const err = await c.execute({ 'v1.part.updateFillet': [{ id: 999999, radius: 6 }] })
  assert.ok(err.maxLevel >= 50 && err.messages.length > 0, 'engine errors surface on suppressed Results')
  console.log('mcp emission-live: OK', { frames: sent.length, pulls: sent.filter(f => f.command === 'GetTree').length })
} finally {
  c.close()
}
