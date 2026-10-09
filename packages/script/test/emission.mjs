// Emission contract of the node session — runs on every build (postbuild).
// Per-CONNECTION config, suppression per SCRIPT:
//   1. connecting sends NO emission config — outside a script the connection
//      keeps the engine defaults (Results carry structure + graphic)
//   2. runScript brackets the script: SetEmissionConfig(suppress) first,
//      bare mutations without payloads, SetEmissionConfig(restore) last —
//      also when the script fails
//   3. inside a script tree()/graphic() pull via GetTree; the graphic pull
//      toggles the kernel category on/off around it
//   4. repeated reads without a mutation are no-ops; a mutation invalidates
//   5. errors still arrive on suppressed Results; recalc is opt-in
//   6. requestVisualisation delivers its graphic even while suppressed
//   7. outside a script the tree cache is fed by the Results themselves (no
//      pull), the graphic pull is a plain GetTree (no toggling)
//   8. graphics:false never toggles; an engine without the config commands
//      still runs scripts (unsuppressed)
import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { connectSession, runScript } from '../dist/node.js'
import { startFakeWorker, isMutation, isPull, isSetEmissionConfig, isSuppressProfile, isRestoreProfile, carriesNoConfig } from './fake-worker.mjs'

const SCRIPT = `
  for (let i = 0; i < 5; i++) await api.v1.sketch.line({ id: 1 })
  const t1 = await api.tree()
  const t2 = await api.tree()
  const g1 = await api.graphic()
  const g2 = await api.graphic()
  await api.v1.part.extrusion({ id: 4 })
  const g3 = await api.graphic()
  const t3 = await api.tree()
  const err = await api.v1.part.fail({})
  const rv = await api.v1.common.requestVisualisation({ ids: [87] })
  return { nodes: Object.keys(t1).length, sameTree: t1 === t2, containers: g1?.containers?.length, sameGraphic: g1 === g2,
           errLevel: err.maxLevel, errMsgs: err.messages.length, errStructure: err.structure, errGraphic: err.graphic,
           rvGraphic: rv.graphic?.containers?.length, after: g3?.containers?.length, t3: Object.keys(t3).length }
`

test('node session: no config on connect, suppression scoped to runScript, pull on demand', async () => {
  const worker = await startFakeWorker()
  const s = await connectSession(worker.url, { debug: true })
  try {
    // 1. nothing configured on connect; outside a script Results carry payloads
    assert.equal(worker.frames.length, 0, 'connect sends nothing')
    const r0 = await s.execute({ 'v1.part.create': [{ name: 'P' }] })
    assert.ok(r0.structure?.tree, 'unsuppressed Result carries the structure')
    assert.ok(r0.graphic?.containers?.length, 'unsuppressed Result carries the graphic')
    const t0 = await s.getTree()
    assert.ok(t0[4])
    assert.equal(worker.frames.filter(isPull).length, 0, 'tree cache fed by the Result — no pull outside a script')
    const start = worker.frames.length

    // 2./3./4./5./6. one script
    const res = await runScript(SCRIPT, s)
    assert.equal(res.ok, true, res.error)
    const f = worker.frames.slice(start)
    assert.equal(f[0].command, 'GetEmissionConfig', 'runScript reads the current config first')
    assert.ok(isSuppressProfile(f[1]), 'then switches to the suppress profile')
    assert.ok(isRestoreProfile(f[f.length - 1]), 'and restores the previous flags last')
    const muts = f.filter(isMutation)
    assert.equal(muts.length, 8, '5 lines + extrusion + fail + requestVisualisation, all bare')
    assert.ok(f.every(carriesNoConfig), 'no request other than SetEmissionConfig carries a config field')
    assert.equal(res.returned.errStructure, null, 'suppressed Result carries no structure')
    assert.equal(res.returned.errGraphic, null, 'suppressed Result carries no graphic')
    assert.equal(res.returned.errLevel, 51)
    assert.equal(res.returned.errMsgs, 1)
    assert.ok(res.returned.rvGraphic, 'requestVisualisation delivers its graphic while suppressed')
    assert.ok(res.returned.nodes >= 1)
    assert.ok(res.returned.sameTree && res.returned.sameGraphic, 'repeated reads served from the caches')
    const pulls = f.filter(isPull)
    assert.equal(pulls.length, 2, 'tree()+graphic() = one pull, then one pull after the extrusion')
    for (const pull of pulls) {
      const i = f.indexOf(pull)
      assert.equal(f[i - 1].command, 'SetEmissionConfig', 'kernel graphic switched on before the GetTree')
      assert.equal(f[i - 1].config.sendGraphic_Kernel, true)
      assert.equal(f[i + 1].command, 'SetEmissionConfig', 'and off again after it')
      assert.equal(f[i + 1].config.sendGraphic_Kernel, false)
    }
    assert.equal(f.filter(x => /recalc/.test(JSON.stringify(x))).length, 0, 'recalc is opt-in')

    // 7. outside again: plain pulls, no toggling; the connection is back to defaults
    const before = worker.frames.length
    await s.execute({ 'v1.part.box': [{ id: 4 }] })
    await s.getTree()
    assert.equal(worker.frames.slice(before).filter(isPull).length, 0, 'structure came with the Result')
    await s.getGraphic()
    const tail = worker.frames.slice(before)
    assert.equal(tail.filter(isPull).length, 1, 'graphic needs one plain GetTree')
    assert.equal(tail.filter(isSetEmissionConfig).length, 0, 'no toggling outside a script')
    const cfg = await s.getEmissionConfig()
    assert.equal(cfg.sendStructure, true)
    assert.equal(cfg.sendGraphic_Kernel, true)

    // 2b. restore also happens when the script throws
    const before2 = worker.frames.length
    const bad = await runScript(`await api.v1.sketch.line({ id: 1 }); throw new Error('boom')`, s)
    assert.equal(bad.ok, false)
    assert.ok(isRestoreProfile(worker.frames[worker.frames.length - 1]), 'flags restored after a failing script')
    assert.ok(isSuppressProfile(worker.frames[before2 + 1]))
  } finally {
    s.close()
    await worker.close()
  }
})

test('node session: graphics:false never toggles; explicit refresh/recalc', async () => {
  const worker = await startFakeWorker()
  const s = await connectSession(worker.url, { debug: true, graphics: false })
  try {
    const res = await runScript(`await api.v1.part.create({ name: 'P' }); const t = await api.tree(); await api.graphic(); return Object.keys(t).length`, s)
    assert.equal(res.ok, true, res.error)
    assert.equal(worker.frames.filter(f => isSetEmissionConfig(f) && f.config.sendGraphic_Kernel === true && Object.keys(f.config).length === 1).length, 0, 'no kernel toggling')
    assert.equal(worker.frames.filter(isPull).length, 1, 'tree()+graphic() = one bare GetTree')
    await s.getTree({ refresh: true })
    assert.equal(worker.frames.filter(isPull).length, 2)
    await s.getGraphic({ recalc: true })
    assert.equal(worker.frames.filter(f => /recalc/.test(JSON.stringify(f))).length, 1)
    assert.equal(worker.frames.filter(f => f.command === 'Configuration').length, 0, 'no legacy Configuration command')
  } finally {
    s.close()
    await worker.close()
  }
})

test('node session: engine without the config commands still runs scripts', async () => {
  const worker = await startFakeWorker({ configCommands: false })
  const s = await connectSession(worker.url, { debug: true })
  try {
    const res = await runScript(`const r = await api.v1.part.create({ name: 'P' }); const t = await api.tree(); return { hasStructure: !!r.structure, nodes: Object.keys(t).length }`, s)
    assert.equal(res.ok, true, res.error)
    assert.equal(res.returned.hasStructure, true, 'unsuppressed: the Result carries the structure')
    assert.equal(worker.frames.filter(isSetEmissionConfig).length, 0, 'no SetEmissionConfig after the unsupported GetEmissionConfig')
    assert.equal(worker.frames.filter(f => f.command === 'GetEmissionConfig').length, 1)
  } finally {
    s.close()
    await worker.close()
  }
})

test('node session: after anyone else in the session ran a command, the caches are stale and the graphic settings go back first', async () => {
  const worker = await startFakeWorker()
  const s = await connectSession(worker.url, { debug: true })
  const isSettings = f => f.command === 'Execute' && 'v1.common.setDatabaseSettings' in (f.task?.[0] ?? {})
  const since = n => worker.frames.slice(n).map(f => (isSettings(f) ? 'settings' : f.command))
  // What the server fans out of another participant's command: its frames, not its request
  const sibling = async from => {
    worker.sibling({ command: 'Result', _from_: from, _transactionID_: `sibling-${from}`, result: null, maxLevel: 31 })
    await new Promise(r => setTimeout(r, 50))
  }
  try {
    await s.execute({ 'v1.part.create': [{ name: 'P' }] })
    let n = worker.frames.length
    await s.getGraphic()
    assert.deepEqual(since(n), ['settings', 'GetTree'], 'set before the first pull')
    n = worker.frames.length
    await s.getGraphic()
    await sibling('GetTree')
    await s.getGraphic()
    assert.deepEqual(since(n), [], 'nothing to send while current, nor after another participant\'s pull')

    // An app's Execute may have changed the model, and may have been its own setDatabaseSettings
    await sibling('Execute')
    n = worker.frames.length
    await s.getTree()
    assert.deepEqual(since(n), ['settings', 'GetTree'], 'the tree is stale; the settings go back before the pull')

    // Pulls asked for at once wait for the same settings
    await sibling('Execute')
    n = worker.frames.length
    await Promise.all([s.getGraphic(), s.getTree()])
    const sent = since(n)
    assert.equal(sent[0], 'settings')
    assert.equal(sent.filter(x => x === 'settings').length, 1)
  } finally {
    s.close()
    await worker.close()
  }
})
