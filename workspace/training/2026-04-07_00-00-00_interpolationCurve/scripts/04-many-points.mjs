// Many points — smooth S-curve with 8 points
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'InterpMany' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S' })).result

  const points = [
    [0, 0, 0],
    [10, 20, 0],
    [20, -10, 0],
    [30, 15, 0],
    [40, -5, 0],
    [50, 25, 0],
    [60, 0, 0],
    [70, 10, 0],
  ]

  const r = await api.v1.curve.interpolationCurve({
    id: shapeId,
    points,
  })

  console.log('[04] result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[04] points count:', points.length)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, '04-response')

  await snapshot('8points')
  return { partId }
}
