// Test: matrix with scaling component — docs say scaling is ignored
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ScaleMatrix' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S' })).result

  await api.v1.curve.advancedPolyline({
    id: shapeId,
    pld: [{ xa: 0, ya: 0 }, { xa: 20, ya: 0 }, { xa: 20, ya: 10 }, { xa: 0, ya: 10 }],
    close: true,
  })

  // Scaling matrix: 2x in X, 3x in Y (non-orthogonal due to scaling)
  const r = await api.v1.curve.transformShape({
    id: shapeId,
    matrix: [
      [2, 0, 0, 0],
      [0, 3, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ],
  })

  console.log('[06] scaling matrix result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[06] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'scaling-response')

  // Take snapshot regardless — if it works, we can see if geometry changed
  await snapshot('06-scaling')

  return { partId, shapeId }
}
