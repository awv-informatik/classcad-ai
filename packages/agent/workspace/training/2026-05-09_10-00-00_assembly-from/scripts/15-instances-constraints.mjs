// Test: can we create instances and constraints via JSON
// even though templates don't work?
// Also test: is from() with empty arrays identical to assembly.create()?
export default async function (api, { snapshot, filewrite }) {
  console.log('[15] Testing instances/constraints in JSON and comparing to create()...')

  // Test 1: from() with instance entries (no templates = no valid products to reference)
  const json1 = {
    templates: [],
    instances: [{ name: 'Inst1', product: 'NonExistent' }],
    constraints: [],
  }
  const r1 = await api.v1.assembly.from({ data: JSON.stringify(json1), format: 'JSON' })
  console.log('[15] instance entry:', 'result:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) {
    for (const m of r1.messages) {
      console.log(`[15]   ${m.levelStr}: ${m.message.substring(0, 120)}`)
    }
  }
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'instance-entry')

  // Test 2: instance with various field names
  await api.v1.common.clear({})
  const json2 = {
    templates: [],
    instances: [{ name: 'Inst1', productId: 'Box', transformation: [[0,0,0],[1,0,0],[0,1,0]] }],
    constraints: [],
  }
  const r2 = await api.v1.assembly.from({ data: JSON.stringify(json2), format: 'JSON' })
  console.log('[15] instance productId:', 'result:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages?.length) {
    for (const m of r2.messages) {
      console.log(`[15]   ${m.levelStr}: ${m.message.substring(0, 120)}`)
    }
  }
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'instance-productId')

  // Test 3: constraint entries
  await api.v1.common.clear({})
  const json3 = {
    templates: [],
    instances: [],
    constraints: [{ name: 'C1', type: 'fastened' }],
  }
  const r3 = await api.v1.assembly.from({ data: JSON.stringify(json3), format: 'JSON' })
  console.log('[15] constraint entry:', 'result:', r3.result, 'maxLevel:', r3.maxLevel)
  if (r3.messages?.length) {
    for (const m of r3.messages) {
      console.log(`[15]   ${m.levelStr}: ${m.message.substring(0, 120)}`)
    }
  }
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'constraint-entry')

  // Test 4: Compare from() empty assembly to create() assembly
  await api.v1.common.clear({})
  const fromRes = await api.v1.assembly.from({
    data: JSON.stringify({ templates: [], instances: [], constraints: [] }),
    format: 'JSON',
  })
  const fromTree = fromRes.structure?.tree || {}
  const fromClasses = Object.values(fromTree).map(n => n.class).sort()
  console.log('[15] from() classes:', fromClasses.join(', '))

  await api.v1.common.clear({})
  const createRes = await api.v1.assembly.create({})
  const createTree = createRes.structure?.tree || {}
  const createClasses = Object.values(createTree).map(n => n.class).sort()
  console.log('[15] create() classes:', createClasses.join(', '))

  console.log('[15] Same structure?', JSON.stringify(fromClasses) === JSON.stringify(createClasses))
  filewrite({
    fromClasses,
    createClasses,
    identical: JSON.stringify(fromClasses) === JSON.stringify(createClasses),
  }, 'from-vs-create')

  return {}
}
