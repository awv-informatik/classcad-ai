// Live counterpart of emission.mjs against a real worker. Skips (exit 0) when
// no worker is reachable — set CLASSCAD_URL to point at one (default
// ws://localhost:9094/). Pins the properties the fake worker only emulates:
// the REAL engine keeps the emission config per connection, GetTree always
// returns the structure, requestVisualisation always returns its graphic,
// and runScript's suppress/restore bracket round-trips through it.
import { strict as assert } from 'node:assert'
import WebSocket from 'ws'
import { connectSession, runScript } from '../dist/node.js'

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
try {
  // 0. nothing configured on connect: the engine's defaults are in effect
  assert.equal(sent.length, 0, 'connect sends nothing')
  const cfg0 = await s.getEmissionConfig()
  assert.equal(cfg0.sendStructure, true, 'engine default: structure on')
  assert.equal(cfg0.sendGraphic_Kernel, true, 'engine default: kernel graphic on')
  const r0 = await s.execute({ 'v1.part.create': [{ name: 'EmissionLive' }] })
  assert.ok(r0.structure?.tree, 'unsuppressed Result carries the structure')
  const partId = r0.result && typeof r0.result === 'object' && 'result' in r0.result ? r0.result.result : r0.result

  // 1. a script: suppressed mutations, pulls with the kernel toggle, requestVisualisation, restore
  const start = sent.length
  const res = await runScript(`
    const u = r => (r.result && typeof r.result === 'object' && 'result' in r.result ? r.result.result : r.result)
    const tree0 = await api.tree()
    const topPl = Object.values(tree0).find(n => n.class === 'CC_WorkPlane' && n.name === 'Top').id
    const sk = u(await api.v1.sketch.create({ id: ${JSON.stringify(partId)}, planeId: topPl, name: 'S' }))
    const pts = [[0, 0], [30, 0], [30, 20], [0, 20]]
    const lines = u(await api.v1.sketch.line(pts.map((q, i) => ({ id: sk, startPos: [q[0], q[1], 0], endPos: [...pts[(i + 1) % 4], 0] }))))
    const ext = await api.v1.part.extrusion({ id: ${JSON.stringify(partId)}, name: 'Ex', references: lines, type: 'UP', limit2: 8 })
    const g = await api.graphic()
    const tree = await api.tree()
    const solidIds = Object.values(tree).filter(n => n.class === 'CC_Solid').map(n => n.id)
    const rv = await api.v1.common.requestVisualisation({ ids: solidIds })
    const err = await api.v1.part.updateFillet({ id: 999999, radius: 6 })
    return { extStructure: ext.structure, extGraphic: ext.graphic, meshes: g?.containers?.some(c => c.meshes?.length > 0),
             hasExtrusion: Object.values(tree).some(n => /Extrusion/.test(n.class)), rvGraphic: rv.graphic?.containers?.length,
             errLevel: err.maxLevel, errMsgs: err.messages.length }
  `, s)
  assert.equal(res.ok, true, res.error)
  const f = sent.slice(start)
  assert.equal(f[0].command, 'GetEmissionConfig')
  assert.equal(f[1].command, 'SetEmissionConfig')
  assert.equal(f[1].config.sendStructure, false)
  assert.equal(f[f.length - 1].command, 'SetEmissionConfig', 'flags restored after the script')
  assert.equal(f[f.length - 1].config.sendStructure, true)
  assert.ok(f.filter(x => x.command === 'Execute').every(x => x.config === undefined), 'mutations carry no config field')
  assert.equal(res.returned.extStructure, null, 'suppressed Result carries no structure')
  assert.equal(res.returned.extGraphic, null, 'suppressed Result carries no graphic')
  assert.ok(res.returned.meshes, 'graphic pulled with meshes')
  assert.ok(res.returned.hasExtrusion, 'tree pulled with the extrusion')
  assert.ok(res.returned.rvGraphic, 'requestVisualisation returns its graphic although every category is off')
  assert.ok(res.returned.errLevel >= 50 && res.returned.errMsgs > 0, 'engine errors surface on suppressed Results')
  // tree0 is served from the cache: the part.create Result before the script carried the structure (full emission).
  assert.equal(f.filter(x => x.command === 'GetTree').length, 1, 'graphic()+tree() after the mutations = one GetTree')

  // 2. after the script: defaults again, explicit GetTree still returns the structure
  const cfg1 = await s.getEmissionConfig()
  assert.equal(cfg1.sendGraphic_Kernel, true, 'kernel graphic restored')
  assert.equal(cfg1.sendStructure, true, 'structure restored')
  const bare = await s.request('GetTree', {}, { track: false })
  assert.ok(bare.structure?.tree && bare.graphic?.containers?.length, 'GetTree under defaults: structure and graphic')
  console.log('emission-live: OK', { frames: sent.length, pulls: sent.filter(x => x.command === 'GetTree').length, setEmissionConfigs: sent.filter(x => x.command === 'SetEmissionConfig').length })
} finally {
  s.close()
}
