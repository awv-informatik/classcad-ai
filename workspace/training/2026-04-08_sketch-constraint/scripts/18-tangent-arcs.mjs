// Test TANGENT constraint between two arcs
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Two arcs near each other
  const arc1Id = (await api.v1.sketch.arcByCenter({
    id: skId, centerPos: [20, 30, 0], startPos: [20, 50, 0], endPos: [40, 30, 0],
    genFixation: false,
  })).result
  const arc2Id = (await api.v1.sketch.arcByCenter({
    id: skId, centerPos: [60, 30, 0], startPos: [40, 30, 0], endPos: [60, 50, 0],
    genFixation: false,
  })).result
  console.log('[18] arc1Id:', arc1Id, 'arc2Id:', arc2Id)

  const r = await api.v1.sketch.constraint({
    id: skId, type: 'TANGENT', geomIds: [arc1Id, arc2Id],
  })
  console.log('[18] tangent-arcs result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[18] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'tangent-arcs-response')
  await snapshot('tangent-arcs')
  return { partId }
}
