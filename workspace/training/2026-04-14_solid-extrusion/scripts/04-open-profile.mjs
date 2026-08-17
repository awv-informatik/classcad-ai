// Test extrusion with an open profile (non-closed polyline) — what happens?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'OpenProfileTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'OpenProfile' })).result
  await api.v1.curve.advancedPolyline({
    id: shapeId,
    pld: [
      { xa: 0, ya: 0 },
      { xa: 40, ya: 0 },
      { xa: 40, ya: 30 },
      { xa: 0, ya: 30 },
    ],
    close: false,  // NOT closed
  })

  const r = await api.v1.solid.extrusion({ id: eifId, direction: [0, 0, 40], curves: shapeId })
  console.log('[04] open profile result:', r.result)
  console.log('[04] maxLevel:', r.maxLevel)
  console.log('[04] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'open-profile')

  if (r.result) {
    await snapshot('open-profile')
  }
  return { partId }
}
