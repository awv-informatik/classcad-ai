// Error case: 2D points [x,y] instead of [x,y,z]
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: '2DPts' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'TwoD' })).result

  const r = await api.v1.curve.bezierCurve({
    id: shapeId,
    points: [[0, 0], [10, 30], [30, 30], [40, 0]],
  })

  console.log('[07] 2D points: result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[07] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, '2d-pts-response')
  return { partId }
}
