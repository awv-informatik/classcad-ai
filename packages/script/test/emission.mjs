// Emission contract of the node session — runs on every build (postbuild).
//   1. mutations carry a per-request config that suppresses structure+graphics
//      (messages stay on) — a 100-command script is 100 small Results
//   2. tree()/graphic() pull via ONE GetTree that fills both caches
//   3. repeated tree()/graphic() without a mutation in between is a no-op
//   4. a mutation invalidates the caches; the next read pulls again
//   5. errors still arrive on suppressed Results (maxLevel/messages)
//   6. recalc is opt-in (never sent unless asked for)
import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { connectSession } from '../dist/session-node.js'
import { startFakeWorker, isMutation, isPull, suppressed } from './fake-worker.mjs'

test('node session: suppress on mutation, pull once, cache until the next mutation', async () => {
  const worker = await startFakeWorker()
  const s = await connectSession(worker.url, { debug: true })
  try {
    // 1. every mutation is suppressed
    for (let i = 0; i < 5; i++) await s.execute({ 'v1.sketch.line': [{ id: 1 }] })
    const muts = worker.frames.filter(isMutation)
    assert.equal(muts.length, 5)
    assert.ok(muts.every(suppressed), 'every mutation carries the suppress config')
    assert.equal(worker.frames.filter(isPull).length, 0, 'no pull before a read')

    // 2. first tree() pulls once; the pull requests bundled snapshot + JSON graphic
    const tree = await s.tree?.() ?? await s.getTree()
    assert.ok(tree[4], 'tree served from the pull')
    let pulls = worker.frames.filter(isPull)
    assert.equal(pulls.length, 1)
    assert.equal(pulls[0].config.sendStructure, true)
    assert.equal(pulls[0].config.sendStructure_Patch, false)
    assert.equal(pulls[0].config.sendStructure_Immediately, false)
    assert.equal(pulls[0].config.sendGraphic_Kernel, true)
    assert.equal(pulls[0].config.sendGraphic_ImmediatelyBinary, false)

    // 3. repeated reads are no-ops; graphic() shares the same pull
    await s.getTree()
    await s.getTree()
    const g = await s.getGraphic()
    assert.ok(g?.containers?.length, 'graphic served from the same pull')
    await s.getGraphic()
    assert.equal(worker.frames.filter(isPull).length, 1, 'tree();tree();graphic();graphic() = one pull')
    assert.equal(worker.frames.filter(f => /recalc/.test(JSON.stringify(f))).length, 0, 'recalc is opt-in')

    // 4. a mutation invalidates; the next read pulls again — exactly once
    await s.execute({ 'v1.part.extrusion': [{ id: 4 }] })
    await s.getGraphic()
    await s.getTree()
    assert.equal(worker.frames.filter(isPull).length, 2)

    // 5. errors survive suppression
    const err = await s.execute({ 'v1.part.fail': [{}] })
    assert.equal(err.maxLevel, 51)
    assert.equal(err.messages.length, 1)
    assert.equal(err.structure, undefined)
    assert.equal(err.graphic, null)

    // 6. explicit refresh / recalc do what they say
    await s.getTree({ refresh: true })
    assert.equal(worker.frames.filter(isPull).length, 3)
    await s.getGraphic({ recalc: true })
    assert.equal(worker.frames.filter(f => /recalc/.test(JSON.stringify(f))).length, 1)
    assert.equal(worker.frames.filter(isPull).length, 4, 'recalc counts as a mutation → pull')
  } finally {
    s.close()
    await worker.close()
  }
})

test('node session: no connect-time Configuration command', async () => {
  const worker = await startFakeWorker()
  const s = await connectSession(worker.url, { debug: true })
  try {
    await s.getTree()
    assert.equal(worker.frames.filter(f => f.command === 'Configuration').length, 0)
  } finally {
    s.close()
    await worker.close()
  }
})
