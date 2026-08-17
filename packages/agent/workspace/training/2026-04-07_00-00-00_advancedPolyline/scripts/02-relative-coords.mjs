// Test advancedPolyline with relative coordinates (xr/yr)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({})).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'RelRect' })).result

  // Rectangle using relative coords — should produce same shape as absolute
  const r = await api.v1.curve.advancedPolyline({
    id: shapeId,
    pld: [
      { xa: 0, ya: 0 },     // start absolute
      { xr: 60, yr: 0 },    // right 60
      { xr: 0, yr: 40 },    // up 40
      { xr: -60, yr: 0 },   // left 60
    ],
    close: true,
  })

  console.log('[02] result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'rel-rect-response')
  await snapshot('rel-rect')
  return { partId }
}
