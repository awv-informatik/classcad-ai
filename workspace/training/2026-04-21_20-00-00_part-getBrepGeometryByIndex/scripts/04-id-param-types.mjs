export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})

  // Test 1: feature ID (expected to work)
  const r1 = await api.v1.part.getBrepGeometryByIndex({ id: boxId, lineIndex: 0 })
  console.log(`[04] feature ID: result=${r1.result}, maxLevel=${r1.maxLevel}`)

  // Test 2: part ID (expected to fail)
  const r2 = await api.v1.part.getBrepGeometryByIndex({ id: partId, lineIndex: 0 })
  console.log(`[04] part ID: result=${r2.result}, maxLevel=${r2.maxLevel}`)
  if (r2.messages) console.log(`[04] part ID messages:`, r2.messages.map(m => m.message).join('; '))

  // Test 3: invalid ID
  const r3 = await api.v1.part.getBrepGeometryByIndex({ id: 99999, lineIndex: 0 })
  console.log(`[04] invalid ID: result=${r3.result}, maxLevel=${r3.maxLevel}`)
  if (r3.messages) console.log(`[04] invalid ID messages:`, r3.messages.map(m => m.message).join('; '))

  filewrite({ featureId: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
              partId: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
              invalidId: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages } }, 'id-types')
  return { partId }
}
