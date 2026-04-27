export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})

  // Test 1: completely invalid ID (9999)
  console.log('[06] --- Test 1: invalid ID 9999 ---')
  const r1 = await api.v1.part.getGeometryPositions({ elems: [9999] })
  console.log('[06] maxLevel:', r1.maxLevel)
  console.log('[06] result:', JSON.stringify(r1.result))
  console.log('[06] messages:', JSON.stringify(r1.messages))

  // Test 2: part ID instead of brep element ID
  console.log('[06] --- Test 2: part ID as elem ---')
  const r2 = await api.v1.part.getGeometryPositions({ elems: [partId] })
  console.log('[06] maxLevel:', r2.maxLevel)
  console.log('[06] result:', JSON.stringify(r2.result))
  console.log('[06] messages:', JSON.stringify(r2.messages))

  // Test 3: feature ID instead of brep element ID
  console.log('[06] --- Test 3: feature (box) ID as elem ---')
  const r3 = await api.v1.part.getGeometryPositions({ elems: [boxId] })
  console.log('[06] maxLevel:', r3.maxLevel)
  console.log('[06] result:', JSON.stringify(r3.result))
  console.log('[06] messages:', JSON.stringify(r3.messages))

  // Test 4: empty array
  console.log('[06] --- Test 4: empty elems array ---')
  const r4 = await api.v1.part.getGeometryPositions({ elems: [] })
  console.log('[06] maxLevel:', r4.maxLevel)
  console.log('[06] result:', JSON.stringify(r4.result))

  // Test 5: mix of valid and invalid IDs
  const geoIds = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [40, 0, 0] }],
  })
  const validId = geoIds.result.lines[0]
  console.log('[06] --- Test 5: mix valid + invalid ---')
  const r5 = await api.v1.part.getGeometryPositions({ elems: [validId, 9999] })
  console.log('[06] maxLevel:', r5.maxLevel)
  console.log('[06] result:', JSON.stringify(r5.result))
  console.log('[06] messages:', JSON.stringify(r5.messages))

  filewrite({
    test1_invalidId: { maxLevel: r1.maxLevel, result: r1.result, messages: r1.messages },
    test2_partId: { maxLevel: r2.maxLevel, result: r2.result, messages: r2.messages },
    test3_featureId: { maxLevel: r3.maxLevel, result: r3.result, messages: r3.messages },
    test4_emptyArray: { maxLevel: r4.maxLevel, result: r4.result },
    test5_mixedIds: { maxLevel: r5.maxLevel, result: r5.result, messages: r5.messages },
  }, 'invalid-ids')

  return { partId }
}
