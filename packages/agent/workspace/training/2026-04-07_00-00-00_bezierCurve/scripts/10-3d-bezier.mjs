// 3D bezier — control points in 3D space (non-planar)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: '3DBez' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: '3D' })).result

  const r = await api.v1.curve.bezierCurve({
    id: shapeId,
    points: [
      [0, 0, 0],
      [10, 30, 20],
      [30, 10, -10],
      [40, 0, 15],
    ],
  })

  console.log('[10] 3D bezier: result:', r.result, 'maxLevel:', r.maxLevel)

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, '3d-response')

  await snapshot('3d-bezier')
  return { partId }
}
