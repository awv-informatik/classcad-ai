// Test CONCENTRIC constraint between two circles/arcs
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Two circles with different centers
  const c1Id = (await api.v1.sketch.circle({
    id: skId, centerPos: [30, 30, 0], radius: 20,
    genFixation: false,
  })).result
  const c2Id = (await api.v1.sketch.circle({
    id: skId, centerPos: [40, 35, 0], radius: 10,
    genFixation: false,
  })).result
  console.log('[10] c1Id:', c1Id, 'c2Id:', c2Id)

  const r = await api.v1.sketch.constraint({
    id: skId, type: 'CONCENTRIC', geomIds: [c1Id, c2Id],
  })
  console.log('[10] concentric result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'concentric-response')
  await snapshot('concentric')
  return { partId }
}
