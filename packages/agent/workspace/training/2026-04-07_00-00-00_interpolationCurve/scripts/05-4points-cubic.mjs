// 4 points = degree 3 (cubic) — the most common spline degree
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'InterpCubic' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S' })).result

  const r = await api.v1.curve.interpolationCurve({
    id: shapeId,
    points: [
      [0, 0, 0],
      [10, 30, 0],
      [30, 30, 0],
      [40, 0, 0],
    ],
  })

  console.log('[05] result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, '05-response')

  await snapshot('4points-cubic')
  return { partId }
}
