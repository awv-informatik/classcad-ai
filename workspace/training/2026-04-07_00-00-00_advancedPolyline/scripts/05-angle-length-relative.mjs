// Test advancedPolyline with relative angle + length (l/ar)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({})).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'RelAngle' })).result

  const PI = Math.PI
  // Square using relative angles — each turn is 90 degrees CCW
  const r = await api.v1.curve.advancedPolyline({
    id: shapeId,
    pld: [
      { xa: 0, ya: 0 },
      { l: 50, a: 0 },              // first segment along x-axis
      { l: 50, ar: PI / 2 },        // turn 90 degrees CCW, go 50
      { l: 50, ar: PI / 2 },        // turn 90 degrees CCW, go 50
    ],
    close: true,
  })

  console.log('[05] result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'rel-angle-response')
  await snapshot('rel-angle-square')
  return { partId }
}
