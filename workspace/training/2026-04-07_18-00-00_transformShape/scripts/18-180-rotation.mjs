// Test: 180° rotation around Z axis
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Rot180' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S' })).result

  // Asymmetric L-shape
  await api.v1.curve.advancedPolyline({
    id: shapeId,
    pld: [
      { xa: 0, ya: 0 },
      { xa: 40, ya: 0 },
      { xa: 40, ya: 10 },
      { xa: 10, ya: 10 },
      { xa: 10, ya: 25 },
      { xa: 0, ya: 25 },
    ],
    close: true,
  })

  // 180° rotation: cos180=-1, sin180=0
  const r = await api.v1.curve.transformShape({
    id: shapeId,
    matrix: [
      [-1, 0, 0, 0],
      [0, -1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ],
  })
  console.log('[18] 180° result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'rot-180-response')

  await snapshot('18-rot-180')

  return { partId }
}
