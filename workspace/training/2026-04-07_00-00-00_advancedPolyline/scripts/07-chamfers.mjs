// Test advancedPolyline with chamfers (c)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({})).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Chamfers' })).result

  // Rectangle with chamfered corners
  const r = await api.v1.curve.advancedPolyline({
    id: shapeId,
    pld: [
      { xa: 0, ya: 0, c: 8 },
      { xa: 80, ya: 0, c: 8 },
      { xa: 80, ya: 50, c: 8 },
      { xa: 0, ya: 50, c: 8 },
    ],
    close: true,
  })

  console.log('[07] result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[07] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'chamfer-response')
  await snapshot('chamfer-rect')
  return { partId }
}
