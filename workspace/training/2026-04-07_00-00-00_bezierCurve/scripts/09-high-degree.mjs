// High degree bezier: 11 control points (degree 10)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'HighDeg' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'High' })).result

  const points = []
  for (let i = 0; i < 11; i++) {
    points.push([i * 10, (i % 2 === 0 ? 0 : 30), 0])
  }

  console.log('[09] points count:', points.length)

  const r = await api.v1.curve.bezierCurve({
    id: shapeId,
    points,
  })

  console.log('[09] high degree (11 pts): result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[09] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'high-degree-response')

  await snapshot('high-degree-bezier')
  return { partId }
}
