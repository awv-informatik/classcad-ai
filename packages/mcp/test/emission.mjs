// Emission contract of the MCP client — runs on every build (postbuild).
// Same properties as @classcad/script's node session (see there), through the
// Client used by run_script, tree/find/graphic and snapshot.
import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { connect } from '../dist/client.js'
import { startFakeWorker, isMutation, isPull, suppressed } from '../../script/test/fake-worker.mjs'

test('mcp client: suppress on mutation, pull once, cache until the next mutation', async () => {
  const worker = await startFakeWorker()
  const c = await connect(worker.url, { debug: true })
  try {
    await c.execute({ 'v1.part.create': [{ name: 'P' }] }) // opens lazily; bootstrap pulls once
    const bootstrapPulls = worker.frames.filter(isPull).length
    assert.ok(bootstrapPulls >= 1, 'bootstrap pulls the session state')
    assert.equal(worker.frames.filter(f => f.command === 'Configuration').length, 0, 'no Configuration command')

    for (let i = 0; i < 5; i++) await c.execute({ 'v1.sketch.line': [{ id: 1 }] })
    const muts = worker.frames.filter(isMutation)
    assert.ok(muts.length >= 6)
    assert.ok(muts.every(suppressed), 'every mutation carries the suppress config')

    const before = worker.frames.filter(isPull).length
    const tree = await c.getTree()
    assert.ok(tree[4])
    await c.getTree()
    const g = await c.getGraphic()
    assert.ok(g?.containers?.length)
    await c.getGraphic()
    assert.equal(worker.frames.filter(isPull).length, before + 1, 'tree();tree();graphic();graphic() = one pull')

    await c.execute({ 'v1.part.extrusion': [{ id: 4 }] })
    await c.getTree()
    assert.equal(worker.frames.filter(isPull).length, before + 2, 'mutation invalidates → one new pull')

    const err = await c.execute({ 'v1.part.fail': [{}] })
    assert.equal(err.maxLevel, 51)
    assert.equal(err.messages.length, 1)
    assert.equal(err.graphic, null)

    // legacy accessors stay coherent with the pull cache
    assert.ok(c.getStructure()?.tree?.[4])
    assert.ok(c.getLastGraphic()?.containers?.length)
  } finally {
    c.close()
    await worker.close()
  }
})
