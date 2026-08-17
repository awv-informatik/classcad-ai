// Test extrusion with a non-rectangular L-shaped profile
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'LShapeTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'LShape' })).result
  await api.v1.curve.advancedPolyline({
    id: shapeId,
    pld: [
      { xa: 0, ya: 0 },
      { xa: 60, ya: 0 },
      { xa: 60, ya: 20 },
      { xa: 20, ya: 20 },
      { xa: 20, ya: 50 },
      { xa: 0, ya: 50 },
    ],
    close: true,
  })

  const r = await api.v1.solid.extrusion({ id: eifId, direction: [0, 0, 30], curves: shapeId })
  console.log('[06] L-shape result:', r.result, 'maxLevel:', r.maxLevel)

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'l-shape')

  await snapshot('l-shape')
  return { partId }
}
