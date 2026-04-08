// Test: combined rotation + translation in one matrix
// Rotate 45° around Z then translate by (60, 20, 0)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Combined' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S' })).result

  await api.v1.curve.advancedPolyline({
    id: shapeId,
    pld: [
      { xa: 0, ya: 0 },
      { xa: 30, ya: 0 },
      { xa: 30, ya: 10 },
      { xa: 0, ya: 10 },
    ],
    close: true,
  })

  const c = Math.cos(Math.PI / 4) // ~0.7071
  const s = Math.sin(Math.PI / 4)

  // Matrix = rotation(45° Z) * translation(60, 20, 0)
  // Actually in a 4x4 homogeneous matrix, rotation goes in the upper 3x3
  // and translation in the last column
  const r = await api.v1.curve.transformShape({
    id: shapeId,
    matrix: [
      [c, -s, 0, 60],
      [s, c, 0, 20],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ],
  })

  console.log('[04] combined result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'combined-response')

  await snapshot('04-combined')

  return { partId, shapeId }
}
