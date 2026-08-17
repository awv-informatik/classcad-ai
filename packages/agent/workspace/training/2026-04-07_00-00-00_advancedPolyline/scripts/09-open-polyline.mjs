// Test open polyline (close: false / omitted)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({})).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'OpenPoly' })).result

  // Open zigzag — no close
  const r = await api.v1.curve.advancedPolyline({
    id: shapeId,
    pld: [
      { xa: 0, ya: 0 },
      { xa: 20, ya: 30 },
      { xa: 40, ya: 0 },
      { xa: 60, ya: 30 },
      { xa: 80, ya: 0 },
    ],
  })

  console.log('[09] result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'open-response')
  await snapshot('open-zigzag')
  return { partId }
}
