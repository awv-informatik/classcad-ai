// Test count=0 and fractional counts
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CountEdge' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [10, 10, 0] })).result
  const rsId = (await api.v1.sketch.rigidSet({ id: skId, geomIds: [l1] })).result

  // Test xCount=0
  const r1 = await api.v1.sketch.linearPattern({
    id: skId, rigidSetId: rsId,
    xCount: 0, xDistance: 20,
  })
  console.log('[10a] count=0: maxLevel:', r1.maxLevel, 'result:', r1.result)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'count-zero')

  // Test fractional xCount=2.5
  const r2 = await api.v1.sketch.linearPattern({
    id: skId, rigidSetId: rsId,
    xCount: 2.5, xDistance: 20,
  })
  console.log('[10b] count=2.5: maxLevel:', r2.maxLevel, 'geometry:', r2.result?.geometry?.length)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'count-fractional')

  // Test negative count
  const r3 = await api.v1.sketch.linearPattern({
    id: skId, rigidSetId: rsId,
    xCount: -2, xDistance: 20,
  })
  console.log('[10c] count=-2: maxLevel:', r3.maxLevel, 'result:', r3.result)
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'count-negative')

  return { partId }
}
