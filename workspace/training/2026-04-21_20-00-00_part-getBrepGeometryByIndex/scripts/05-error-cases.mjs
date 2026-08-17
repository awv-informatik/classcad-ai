export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})

  // Test 1: negative index
  const r1 = await api.v1.part.getBrepGeometryByIndex({ id: boxId, lineIndex: -1 })
  console.log(`[05] negative index: result=${r1.result}, maxLevel=${r1.maxLevel}`)
  if (r1.messages) console.log(`[05] neg messages:`, r1.messages.map(m => m.message).join('; '))

  // Test 2: very large index
  const r2 = await api.v1.part.getBrepGeometryByIndex({ id: boxId, lineIndex: 9999 })
  console.log(`[05] huge index: result=${r2.result}, maxLevel=${r2.maxLevel}`)
  if (r2.messages) console.log(`[05] huge messages:`, r2.messages.map(m => m.message).join('; '))

  // Test 3: no index param at all
  const r3 = await api.v1.part.getBrepGeometryByIndex({ id: boxId })
  console.log(`[05] no index: result=${r3.result}, maxLevel=${r3.maxLevel}`)
  if (r3.messages) console.log(`[05] no index messages:`, r3.messages.map(m => m.message).join('; '))

  // Test 4: multiple index params
  const r4 = await api.v1.part.getBrepGeometryByIndex({ id: boxId, lineIndex: 0, faceIndex: 0 })
  console.log(`[05] multi index: result=${r4.result}, maxLevel=${r4.maxLevel}`)
  if (r4.messages) console.log(`[05] multi messages:`, r4.messages.map(m => m.message).join('; '))

  // Test 5: arcIndex on a box (no arcs exist)
  const r5 = await api.v1.part.getBrepGeometryByIndex({ id: boxId, arcIndex: 0 })
  console.log(`[05] arcIndex on box: result=${r5.result}, maxLevel=${r5.maxLevel}`)
  if (r5.messages) console.log(`[05] arc-box messages:`, r5.messages.map(m => m.message).join('; '))

  // Test 6: nurbsCurveIndex on a box (no NURBS exist)
  const r6 = await api.v1.part.getBrepGeometryByIndex({ id: boxId, nurbsCurveIndex: 0 })
  console.log(`[05] nurbsCurveIndex on box: result=${r6.result}, maxLevel=${r6.maxLevel}`)
  if (r6.messages) console.log(`[05] nurbs-box messages:`, r6.messages.map(m => m.message).join('; '))

  filewrite({
    negativeIndex: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    hugeIndex: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    noIndex: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
    multiIndex: { result: r4.result, maxLevel: r4.maxLevel, messages: r4.messages },
    arcOnBox: { result: r5.result, maxLevel: r5.maxLevel, messages: r5.messages },
    nurbsOnBox: { result: r6.result, maxLevel: r6.maxLevel, messages: r6.messages },
  }, 'error-cases')
  return { partId }
}
