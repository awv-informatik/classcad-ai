// Emission contract of the MCP client — runs on every build (postbuild).
// The client never configures the connection on its own (it may be docked
// into a session shared with an interactive app); run_script suppresses per
// script through @classcad/script's runScript, which is exercised here with
// the same session adapter run_script uses.
import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { connect } from '../dist/client.js'
import { runScript } from '@classcad/script'
import { startFakeWorker, isMutation, isPull, isSetEmissionConfig, isSuppressProfile, isRestoreProfile, carriesNoConfig } from '../../script/test/fake-worker.mjs'

const sessionFor = c => ({
  env: 'node',
  execute: t => c.execute(t),
  getTree: o => c.getTree(o),
  getGraphic: o => c.getGraphic(o),
  getEmissionConfig: () => c.getEmissionConfig(),
  setEmissionConfig: p => c.setEmissionConfig(p),
})

test('mcp client: engine defaults outside scripts, suppression scoped to a script', async () => {
  const worker = await startFakeWorker()
  const c = await connect(worker.url, { debug: true })
  try {
    const r0 = await c.execute({ 'v1.part.create': [{ name: 'P' }] }) // opens lazily; bootstrap pulls once
    assert.equal(worker.frames.filter(isSetEmissionConfig).length, 0, 'nothing configured on connect')
    assert.equal(worker.frames.filter(f => f.command === 'Configuration').length, 0, 'no legacy Configuration command')
    assert.ok(worker.frames.filter(isPull).length >= 1, 'bootstrap pulls the session state')
    assert.ok(r0.structure?.tree, 'unsuppressed Result carries the structure')
    assert.ok(r0.graphic?.containers?.length, 'unsuppressed Result carries the graphic')

    const start = worker.frames.length
    const res = await runScript(`
      for (let i = 0; i < 5; i++) await api.v1.sketch.line({ id: 1 })
      const t = await api.tree(); const g = await api.graphic(); const g2 = await api.graphic()
      const err = await api.v1.part.fail({})
      const rv = await api.v1.common.requestVisualisation({ ids: [87] })
      return { nodes: Object.keys(t).length, containers: g?.containers?.length, same: g === g2, errLevel: err.maxLevel, errStructure: err.structure, rvGraphic: rv.graphic?.containers?.length }
    `, sessionFor(c))
    assert.equal(res.ok, true, res.error)
    const f = worker.frames.slice(start)
    assert.equal(f[0].command, 'GetEmissionConfig')
    assert.ok(isSuppressProfile(f[1]), 'suppress profile set for the script')
    assert.ok(isRestoreProfile(f[f.length - 1]), 'previous flags restored after the script')
    assert.ok(f.every(carriesNoConfig), 'no request other than SetEmissionConfig carries a config field')
    assert.equal(f.filter(isMutation).length, 7)
    assert.equal(res.returned.errStructure, null, 'suppressed Result carries no structure')
    assert.equal(res.returned.errLevel, 51)
    assert.ok(res.returned.rvGraphic, 'requestVisualisation delivers its graphic while suppressed')
    assert.ok(res.returned.containers && res.returned.same, 'graphic pulled once and cached')
    const pulls = f.filter(isPull)
    assert.equal(pulls.length, 1, 'tree()+graphic()+graphic() = one pull')
    const i = f.indexOf(pulls[0])
    assert.deepEqual([f[i - 1].command, f[i + 1].command], ['SetEmissionConfig', 'SetEmissionConfig'], 'kernel graphic toggled around the GetTree')

    // outside again: a plain pull refreshes the caches (what run_script does after every script)
    const before = worker.frames.length
    await c.pull()
    const tail = worker.frames.slice(before)
    assert.deepEqual(tail.map(x => x.command), ['GetTree'], 'plain GetTree, no toggling')
    assert.ok(c.getStructure()?.tree?.[4])
    assert.ok(c.getLastGraphic()?.containers?.length)
    const cfg = await c.getEmissionConfig()
    assert.equal(cfg.sendGraphic_Kernel, true)
    assert.equal(cfg.sendStructure, true)
  } finally {
    c.close()
    await worker.close()
  }
})

test('successful connection survives its handshake timeout', async () => {
  const worker = await startFakeWorker()
  const c = await connect(worker.url)
  try {
    await c.execute({ 'v1.part.create': [{ name: 'P' }] })
    const socket = c.ws
    await new Promise(resolve => setTimeout(resolve, 5200))
    assert.equal(socket.readyState, 1, 'successful socket must remain open after 5 s')
    await c.execute({ 'v1.sketch.line': [{ id: 1 }] })
    assert.equal(c.ws, socket, 'the existing session must be preserved')
  } finally {
    c.close()
    await worker.close()
  }
})
