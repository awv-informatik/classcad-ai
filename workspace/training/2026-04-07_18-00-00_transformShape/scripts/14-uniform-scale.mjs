// Test: uniform scaling (2x all axes) — still non-orthogonal but preserves proportions
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UniformScale' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S' })).result

  await api.v1.curve.advancedPolyline({
    id: shapeId,
    pld: [{ xa: 0, ya: 0 }, { xa: 20, ya: 0 }, { xa: 20, ya: 10 }, { xa: 0, ya: 10 }],
    close: true,
  })

  // Uniform 2x scaling
  const r = await api.v1.curve.transformShape({
    id: shapeId,
    matrix: [
      [2, 0, 0, 0],
      [0, 2, 0, 0],
      [0, 0, 2, 0],
      [0, 0, 0, 1],
    ],
  })
  console.log('[14] uniform scale result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[14] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'uniform-scale-response')

  await snapshot('14-uniform-scale')

  return { partId }
}
