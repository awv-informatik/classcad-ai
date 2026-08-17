// Test advancedPolyline with mixed absolute/relative coordinates
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({})).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'MixedCoords' })).result

  // L-shape using mixed coords
  const r = await api.v1.curve.advancedPolyline({
    id: shapeId,
    pld: [
      { xa: 0, ya: 0 },        // absolute start
      { xa: 80, yr: 0 },       // absolute x=80, relative y=0
      { xr: 0, ya: 30 },       // relative x=0, absolute y=30
      { xa: 40, yr: 0 },       // absolute x=40, relative y=0 (step left)
      { xr: 0, yr: 30 },       // relative: up 30
      { xa: 0, yr: 0 },        // absolute x=0, relative y=0
    ],
    close: true,
  })

  console.log('[03] result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[03] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'mixed-response')
  await snapshot('mixed-l-shape')
  return { partId }
}
