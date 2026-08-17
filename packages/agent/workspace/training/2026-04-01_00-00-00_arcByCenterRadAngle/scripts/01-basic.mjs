// 01 — Basic arcByCenterRadAngle: 90° arc with defaults
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ArcRadAngleTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S1' })).result
  console.log('[01] partId:', partId, 'eifId:', eifId, 'shapeId:', shapeId)

  // 90° arc: startAngle=0, endAngle=PI/2, radius=10
  const r = await api.v1.curve.arcByCenterRadAngle({
    id: shapeId,
    centerPos: [0, 0, 0],
    startAngle: 0,
    endAngle: Math.PI / 2,
    radius: 10,
  })
  console.log('[01] result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'response')

  await snapshot('basic-90deg-arc')
  return { partId, shapeId }
}
