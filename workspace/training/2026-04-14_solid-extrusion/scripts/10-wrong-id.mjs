// Test extrusion with wrong ID types — part ID instead of EIF ID
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'WrongIdTest' })).result
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

  // Wrong: pass part ID instead of EIF ID
  const r1 = await api.v1.solid.extrusion({ id: partId, direction: [0, 0, 40], curves: shapeId })
  console.log('[10] partId as id — result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[10] partId messages:', JSON.stringify(r1.messages))

  // Wrong: pass shape ID as id instead of EIF ID
  const r2 = await api.v1.solid.extrusion({ id: shapeId, direction: [0, 0, 40], curves: shapeId })
  console.log('[10] shapeId as id — result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[10] shapeId messages:', JSON.stringify(r2.messages))

  filewrite({
    partIdAsId: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    shapeIdAsId: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
  }, 'wrong-id')

  return { partId }
}
