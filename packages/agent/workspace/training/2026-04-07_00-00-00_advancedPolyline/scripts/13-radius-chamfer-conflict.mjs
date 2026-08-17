// Test: radius + chamfer on same point (docs say cannot coexist)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({})).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Conflict' })).result

  const r = await api.v1.curve.advancedPolyline({
    id: shapeId,
    pld: [
      { xa: 0, ya: 0 },
      { xa: 60, ya: 0, r: 5, c: 5 },   // both radius AND chamfer!
      { xa: 60, ya: 40 },
      { xa: 0, ya: 40 },
    ],
    close: true,
  })

  console.log('[13] result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[13] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'conflict-response')
  await snapshot('conflict')
  return { partId }
}
