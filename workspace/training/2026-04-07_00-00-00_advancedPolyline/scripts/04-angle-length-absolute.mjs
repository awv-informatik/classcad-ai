// Test advancedPolyline with absolute angle + length (l/a)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({})).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'AbsAngle' })).result

  const PI = Math.PI
  // Triangle using absolute angles
  const r = await api.v1.curve.advancedPolyline({
    id: shapeId,
    pld: [
      { xa: 0, ya: 0 },
      { l: 60, a: 0 },                   // 60 units along x-axis (0 radians)
      { l: 60, a: 2 * PI / 3 },          // 60 units at 120 degrees
    ],
    close: true,
  })

  console.log('[04] result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'abs-angle-response')
  await snapshot('abs-angle-triangle')
  return { partId }
}
