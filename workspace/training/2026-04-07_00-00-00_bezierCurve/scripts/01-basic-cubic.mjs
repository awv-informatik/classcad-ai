// Basic cubic Bezier curve (4 control points = degree 3)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BezierTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Bezier1' })).result

  console.log('[01] partId:', partId, 'eifId:', eifId, 'shapeId:', shapeId)

  const r = await api.v1.curve.bezierCurve({
    id: shapeId,
    points: [
      [0, 0, 0],
      [10, 30, 0],
      [30, 30, 0],
      [40, 0, 0],
    ],
  })

  console.log('[01] result:', r.result)
  console.log('[01] maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'response')

  await snapshot('cubic-bezier')
  return { partId }
}
