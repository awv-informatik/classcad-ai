// Test radius on first point when closed
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({})).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'RadFirst' })).result

  // Radius on first point — docs say this works when closed
  const r = await api.v1.curve.advancedPolyline({
    id: shapeId,
    pld: [
      { xa: 0, ya: 0, r: 10 },     // radius on first point!
      { xa: 80, ya: 0 },
      { xa: 80, ya: 50 },
      { xa: 0, ya: 50 },
    ],
    close: true,
  })

  console.log('[10] result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[10] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'rad-first-response')
  await snapshot('rad-first-closed')
  return { partId }
}
