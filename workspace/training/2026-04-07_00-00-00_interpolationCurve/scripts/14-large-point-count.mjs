// Large point count — 20 points along a sine wave
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'InterpLarge' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S' })).result

  const points = []
  for (let i = 0; i < 20; i++) {
    points.push([i * 5, Math.sin(i * 0.5) * 15, 0])
  }

  const r = await api.v1.curve.interpolationCurve({
    id: shapeId,
    points,
  })

  console.log('[14] result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[14] points count:', points.length)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, '14-response')

  await snapshot('20-points-sine')
  return { partId }
}
