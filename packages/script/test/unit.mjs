// Unit tests for @classcad/script — fake session, no worker needed.
import { strict as assert } from 'assert'
import { buildScriptApi, runScript } from '../dist/index.js'

const calls = []
const fakeTree = { 20: { id: 20, class: 'CC_Part', name: 'Part' } }
const fakeGraphic = {
  containers: [{
    id: 100, type: 1,
    meshes: [{ id: 1, vertices: [0, 0, 0, 7.5, 0, 0], normals: [], indices: [] }],
    edges: [{ id: 2, points: [0, 0, 0, 1, 1, 1] }],
  }],
}
const session = {
  env: 'node',
  execute: async task => {
    calls.push(task)
    return { result: 42, maxLevel: 31, messages: [] }
  },
  getTree: async () => fakeTree,
  getGraphic: async () => fakeGraphic,
  namespaces: { facade: { undo: () => 'undone' }, v1: { HIJACK: true } },
}
const registry = {
  'v1.part.box': { domain: 'part', method: 'box', summary: 'box' },
  'v1.part.cylinder': { domain: 'part', method: 'cylinder', summary: 'cyl' },
  'v1.sketch.create': { domain: 'sketch', method: 'create', summary: 'sketch' },
}

// 1. Registry api: routing + validation with suggestions
{
  const api = buildScriptApi(session, { registry })
  const r = await api.v1.part.box({ id: 4, length: 10 })
  assert.equal(r.result, 42)
  assert.deepEqual(calls.at(-1), { 'v1.part.box': [{ id: 4, length: 10 }] })
  await api.v1.sketch.create() // no params → {}
  assert.deepEqual(calls.at(-1), { 'v1.sketch.create': [{}] })
  assert.throws(() => api.v1.part.bxo, /Unknown method "v1\.part\.bxo".*box/)
  assert.throws(() => api.v1.nope, /Unknown v1 domain "nope"/)
  // 2. tree/graphic plumbing — scripts can FILTER GEOMETRY themselves
  assert.equal((await api.tree())[20].class, 'CC_Part')
  const g = await api.graphic()
  assert.equal(g.containers[0].meshes[0].id, 1)
  // 3. namespace injection: facade present, core keys protected from hijack
  assert.equal(api.facade.undo(), 'undone')
  // core-key hijack via namespaces is rejected: api.v1 stays the real registry api
  assert.throws(() => api.v1.HIJACK, /Unknown v1 domain/)
  assert.equal(api.env, 'node')
}

// 4. Permissive api (no registry): any method routes
{
  const api = buildScriptApi(session)
  await api.v1.whatever.thing({ a: 1 })
  assert.deepEqual(calls.at(-1), { 'v1.whatever.thing': [{ a: 1 }] })
}

// 5. runScript: api call + geometry filtering + logs + return
{
  const res = await runScript(
    `const t = await api.tree()
     const g = await api.graphic()
     const mesh = g.containers[0].meshes.find(m => m.vertices.some((v, i) => i % 3 === 0 && Math.abs(v - 7.5) < 0.01))
     console.log('found mesh', mesh.id)
     const box = await api.v1.part.box({ id: 20, length: 5 })
     return { treeClass: t[20].class, meshId: mesh.id, boxResult: box.result }`,
    session,
    { registry },
  )
  assert.equal(res.ok, true, res.error)
  assert.deepEqual(res.returned, { treeClass: 'CC_Part', meshId: 1, boxResult: 42 })
  assert.deepEqual(res.logs, ['found mesh 1'])
}

// 6. Shadowing: environment globals invisible in BOTH env flavors
{
  const res = await runScript(
    `return [typeof fetch, typeof process, typeof require, typeof window, typeof globalThis].join('/')`,
    session,
  )
  assert.equal(res.returned, 'undefined/undefined/undefined/undefined/undefined')
}

// 7. Errors: syntax, runtime (with log tail), timeout
{
  const bad = await runScript('this is not js', session)
  assert.equal(bad.ok, false)
  assert.match(bad.error, /syntax error/i)

  const boom = await runScript(`console.log('before'); throw new Error('boom')`, session)
  assert.equal(boom.ok, false)
  assert.match(boom.error, /boom/)
  assert.deepEqual(boom.logs, ['before'], 'logs survive failure')

  const slow = await runScript(`await new Promise(r => setTimeout(r, 5000)); return 1`, session, { timeoutMs: 1000 })
  assert.equal(slow.ok, false)
  assert.match(slow.error, /exceeded 1000ms/)
}

// 8. Caps: oversized return value truncated EXPLICITLY, not silently
{
  const res = await runScript(`return 'x'.repeat(100000)`, session, { maxResultChars: 500 })
  assert.equal(res.ok, true)
  assert.ok(typeof res.returned === 'string' && res.returned.includes('TRUNCATED'))
}

// 9. Error in unknown method inside script → surfaced with suggestion, logs kept
{
  const res = await runScript(`console.log('pre'); await api.v1.part.bxo({})`, session, { registry })
  assert.equal(res.ok, false)
  assert.match(res.error, /Unknown method "v1\.part\.bxo"/)
  assert.deepEqual(res.logs, ['pre'])
}

console.log('SCRIPT UNIT OK — registry api, permissive api, tree/graphic access, namespaces, executor, shadowing, errors, caps')
