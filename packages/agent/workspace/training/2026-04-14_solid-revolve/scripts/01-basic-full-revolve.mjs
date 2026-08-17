// Basic full revolve (360°) — rectangle profile around Y axis → torus-like solid
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RevolveTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Create a rectangular profile offset from the Y axis
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Profile' })).result
  await api.v1.curve.advancedPolyline({
    id: shapeId,
    pld: [
      { xa: 40, ya: 0 },
      { xa: 55, ya: 0 },
      { xa: 55, ya: 15 },
      { xa: 40, ya: 15 },
    ],
    close: true,
  })

  // Full revolve around Y axis at origin
  const r = await api.v1.solid.revolve({
    id: eifId,
    originPos: [0, 0, 0],
    direction: [0, 1, 0],
    angle: Math.PI * 2,
    curves: shapeId,
  })

  console.log('[01] revolve result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'revolve-response')

  await snapshot('full-revolve')
  return { partId, eifId, revId: r.result }
}
