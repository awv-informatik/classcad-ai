export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'EdgeCaseTest' })).result
  await api.v1.part.box({ id: partId, name: 'Box', length: 80, width: 60, height: 40 })

  await api.v1.drawing2d.view({ id: partId, types: ['TOP', 'FRONT'] })

  // Test 1: empty types array
  const r1 = await api.v1.drawing2d.centerView({ id: partId, types: [] })
  console.log('[06] empty types[] result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'empty-types')

  // Test 2: invalid type string
  const r2 = await api.v1.drawing2d.centerView({ id: partId, types: ['INVALID'] })
  console.log('[06] invalid type result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'invalid-type')

  // Test 3: type not created
  const r3 = await api.v1.drawing2d.centerView({ id: partId, types: ['RIGHT'] })
  console.log('[06] uncreated type result:', r3.result, 'maxLevel:', r3.maxLevel)
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'uncreated-type')

  // Test 4: wrong id (instance)
  // Skip — no assembly context in this test

  // Test 5: duplicate types
  const r5 = await api.v1.drawing2d.centerView({ id: partId, types: ['TOP', 'TOP'] })
  console.log('[06] duplicate types result:', r5.result, 'maxLevel:', r5.maxLevel)
  filewrite({ result: r5.result, messages: r5.messages, maxLevel: r5.maxLevel }, 'duplicate-types')

  return { partId }
}
