// 3D non-coplanar points
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Interp3D' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S' })).result

  const r = await api.v1.curve.interpolationCurve({
    id: shapeId,
    points: [
      [0, 0, 0],
      [10, 20, 5],
      [20, 0, 15],
      [30, 15, 25],
      [40, 5, 10],
    ],
  })

  console.log('[07] result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, '07-response')

  await snapshot('3d-curve')
  return { partId }
}
