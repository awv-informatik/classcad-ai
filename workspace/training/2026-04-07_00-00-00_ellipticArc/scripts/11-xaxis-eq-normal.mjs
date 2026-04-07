// Edge case: xAxis == normal (should degenerate like ellipse)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S1' })).result

  // xAxis == normal == [0,0,1]
  const r = await api.v1.curve.ellipticArc({
    id: shapeId, centerPos: [0, 0, 0],
    startAngle: 0, endAngle: Math.PI / 2, radius1: 20, radius2: 10,
    xAxis: [0, 0, 1],
    normal: [0, 0, 1],
  })

  console.log('[11] xAxis==normal result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[11] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'response')

  // Dump graphic to see if it degenerates
  filewrite(r.graphic, 'graphic')

  await snapshot('xaxis-eq-normal')
  return { partId }
}
