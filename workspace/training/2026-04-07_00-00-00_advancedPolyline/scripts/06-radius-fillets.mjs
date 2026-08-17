// Test advancedPolyline with radius fillets (r)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({})).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'RadiusFillets' })).result

  // Rounded rectangle — radius on all 4 corners
  const r = await api.v1.curve.advancedPolyline({
    id: shapeId,
    pld: [
      { xa: 0, ya: 0, r: 5 },
      { xa: 80, ya: 0, r: 5 },
      { xa: 80, ya: 50, r: 5 },
      { xa: 0, ya: 50, r: 5 },
    ],
    close: true,
  })

  console.log('[06] result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[06] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'radius-response')
  await snapshot('radius-rounded-rect')
  return { partId }
}
