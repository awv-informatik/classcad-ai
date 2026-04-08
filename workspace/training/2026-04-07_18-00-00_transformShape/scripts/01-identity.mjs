// Test: identity matrix — should be a no-op
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TransformTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Outline' })).result

  // Create an L-shaped polyline
  await api.v1.curve.advancedPolyline({
    id: shapeId,
    pld: [
      { xa: 0, ya: 0 },
      { xa: 40, ya: 0 },
      { xa: 40, ya: 15 },
      { xa: 15, ya: 15 },
      { xa: 15, ya: 30 },
      { xa: 0, ya: 30 },
    ],
    close: true,
  })

  // Apply identity matrix BEFORE any snapshot
  const r = await api.v1.curve.transformShape({
    id: shapeId,
    matrix: [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ],
  })

  console.log('[01] identity result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'identity-response')

  await snapshot('01-identity')

  return { partId, shapeId }
}
