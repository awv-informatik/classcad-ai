// Test zero direction vector [0,0,0] — expecting error
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ZeroDirTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Profile' })).result
  await api.v1.curve.advancedPolyline({
    id: shapeId,
    pld: [
      { xa: 0, ya: 0 },
      { xa: 30, ya: 0 },
      { xa: 30, ya: 20 },
      { xa: 0, ya: 20 },
    ],
    close: true,
  })

  const r = await api.v1.solid.extrusion({ id: eifId, direction: [0, 0, 0], curves: shapeId })
  console.log('[03] zero direction result:', r.result)
  console.log('[03] maxLevel:', r.maxLevel)
  console.log('[03] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'zero-direction')
  return { partId }
}
