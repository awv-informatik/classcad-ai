// Test basic advancedPolyline with absolute coordinates (xa/ya)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({})).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'AbsRect' })).result

  // Simple closed rectangle using absolute coords
  const r = await api.v1.curve.advancedPolyline({
    id: shapeId,
    pld: [
      { xa: 0, ya: 0 },
      { xa: 60, ya: 0 },
      { xa: 60, ya: 40 },
      { xa: 0, ya: 40 },
    ],
    close: true,
  })

  console.log('[01] result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'abs-rect-response')

  await snapshot('abs-rect')
  return { partId }
}
