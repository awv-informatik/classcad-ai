// Test: can you put a shape ID inside an array?
// The docs show shape ID as scalar, but what if you wrap it in an array?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ShapeInArrayTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Profile' })).result
  await api.v1.curve.advancedPolyline({
    id: shapeId,
    pld: [
      { xa: 0, ya: 0 },
      { xa: 50, ya: 0 },
      { xa: 50, ya: 30 },
      { xa: 0, ya: 30 },
    ],
    close: true,
  })

  // Test A: shape ID in an array
  const resultA = await api.v1.solid.extrusion({
    id: eifId,
    direction: [0, 0, 30],
    curves: [shapeId],
  })
  console.log('[09A] shape in array result:', resultA.result, 'maxLevel:', resultA.maxLevel)
  if (resultA.messages?.length) {
    console.log('[09A] messages:', JSON.stringify(resultA.messages.map(m => m.message)))
  }

  filewrite({
    shapeId,
    testA: { curves: [shapeId], result: resultA.result, maxLevel: resultA.maxLevel, messages: resultA.messages },
  }, 'shape-in-array')

  return { partId }
}
