// Test TANGENT constraint between a line and an arc
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create an arc
  const arcId = (await api.v1.sketch.arcByCenter({
    id: skId, centerPos: [30, 30, 0], startPos: [30, 50, 0], endPos: [50, 30, 0],
    genFixation: false,
  })).result
  console.log('[09] arcId:', arcId)

  // Create a line near the arc endpoint
  const lineId = (await api.v1.sketch.line({
    id: skId, startPos: [50, 30, 0], endPos: [80, 10, 0],
    genFixation: false, genVertAndHoriz: false, genIncidence: false,
  })).result
  console.log('[09] lineId:', lineId)

  const r = await api.v1.sketch.constraint({
    id: skId, type: 'TANGENT', geomIds: [arcId, lineId],
  })
  console.log('[09] tangent result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[09] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'tangent-response')
  await snapshot('tangent')
  return { partId }
}
