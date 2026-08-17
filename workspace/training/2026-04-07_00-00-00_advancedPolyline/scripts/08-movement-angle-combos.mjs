// Test movement + angle combos (xa+a, xr+a, yr+ar, ya+ar)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({})).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'MoveAngle' })).result

  const PI = Math.PI
  // From docs example 4: movement and angle definitions
  const r = await api.v1.curve.advancedPolyline({
    id: shapeId,
    pld: [
      { xa: 0, ya: 0 },
      { ya: 10, a: PI / 4 },        // Move at 45 degrees, reaching y=10
      { xr: 10, a: 0 },             // Move at 0 degrees, passing 10 units along x-axis
      { yr: -10, ar: -2.356 },      // Turn 135 degrees CW from last segment
    ],
    close: true,
  })

  console.log('[08] result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'move-angle-response')
  await snapshot('move-angle')
  return { partId }
}
