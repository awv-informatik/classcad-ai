// Live counterpart of emission.mjs for the MCP client against a real worker.
// Skips (exit 0) when no worker is reachable (CLASSCAD_URL, default
// ws://localhost:9094/).
import { strict as assert } from 'node:assert'
import WebSocket from 'ws'
import { connect } from '../dist/client.js'
import { runScript } from '@classcad/script'

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

const sessionFor = c => ({
  env: 'node', execute: t => c.execute(t), getTree: o => c.getTree(o), getGraphic: o => c.getGraphic(o),
  getEmissionConfig: () => c.getEmissionConfig(), setEmissionConfig: p => c.setEmissionConfig(p),
})

const c = await connect(url)
try {
  const partId = (await c.execute({ 'v1.part.create': [{ name: 'EmissionLiveMcp' }] })).result
  assert.equal(sent.filter(x => x.command === 'SetEmissionConfig').length, 0, 'nothing configured on connect')
  assert.equal(sent.filter(x => x.command === 'Configuration').length, 0, 'no legacy Configuration command')
  const cfg0 = await c.getEmissionConfig()
  assert.equal(cfg0.sendGraphic_Kernel, true, 'engine default in effect')

  const start = sent.length
  const res = await runScript(`
    const tree0 = await api.tree()
    const topPl = Object.values(tree0).find(n => n.class === 'CC_WorkPlane' && n.name === 'Top').id
    const sk = (await api.v1.sketch.create({ id: ${JSON.stringify(partId)}, planeId: topPl, name: 'S' })).result
    const pts = [[0, 0], [30, 0], [30, 20], [0, 20]]
    const lines = (await api.v1.sketch.line(pts.map((q, i) => ({ id: sk, startPos: [q[0], q[1], 0], endPos: [...pts[(i + 1) % 4], 0] })))).result
    const ext = await api.v1.part.extrusion({ id: ${JSON.stringify(partId)}, name: 'Ex', references: lines, type: 'UP', limit2: 8 })
    const g = await api.graphic()
    const tree = await api.tree()
    const solidIds = Object.values(tree).filter(n => n.class === 'CC_Solid').map(n => n.id)
    const rv = await api.v1.common.requestVisualisation({ ids: solidIds })
    const err = await api.v1.part.updateFillet({ id: 999999, radius: 6 })
    return { extStructure: ext.structure, extGraphic: ext.graphic, meshes: g?.containers?.some(x => x.meshes?.length > 0),
             hasExtrusion: Object.values(tree).some(n => /Extrusion/.test(n.class)), rvGraphic: rv.graphic?.containers?.length, errLevel: err.maxLevel }
  `, sessionFor(c))
  assert.equal(res.ok, true, res.error)
  const f = sent.slice(start)
  assert.equal(f[0].command, 'GetEmissionConfig')
  assert.equal(f[1].command, 'SetEmissionConfig')
  assert.equal(f[f.length - 1].command, 'SetEmissionConfig', 'flags restored after the script')
  assert.ok(f.filter(x => x.command === 'Execute').every(x => x.config === undefined), 'mutations carry no config field')
  assert.equal(res.returned.extStructure, null, 'suppressed Result carries no structure')
  assert.equal(res.returned.extGraphic, null, 'suppressed Result carries no graphic')
  assert.ok(res.returned.meshes && res.returned.hasExtrusion, 'one pull served graphic and tree')
  assert.ok(res.returned.rvGraphic, 'requestVisualisation returns its graphic although every category is off')
  assert.ok(res.returned.errLevel >= 50, 'engine errors surface on suppressed Results')

  // what run_script does after every script: one plain pull (broadcast brings siblings up to date)
  const before = sent.length
  await c.pull()
  assert.deepEqual(sent.slice(before).map(x => x.command), ['GetTree'], 'plain GetTree after the script')
  assert.ok(c.getLastGraphic()?.containers?.some(x => x.meshes?.length > 0))
  assert.equal((await c.getEmissionConfig()).sendGraphic_Kernel, true, 'defaults restored')
  console.log('mcp emission-live: OK', { frames: sent.length, pulls: sent.filter(x => x.command === 'GetTree').length, setEmissionConfigs: sent.filter(x => x.command === 'SetEmissionConfig').length })
} finally {
  c.close()
}
