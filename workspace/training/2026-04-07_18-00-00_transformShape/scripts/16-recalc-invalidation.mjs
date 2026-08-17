// Test: verify recalc invalidates shape IDs for transformShape too
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RecalcTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S' })).result
  await api.v1.curve.advancedPolyline({
    id: shapeId,
    pld: [{ xa: 0, ya: 0 }, { xa: 20, ya: 0 }, { xa: 20, ya: 10 }, { xa: 0, ya: 10 }],
    close: true,
  })

  // Call recalc explicitly
  await api.v1.common.recalc({})

  // Now try to transform — should fail with error 1006
  const r = await api.v1.curve.transformShape({
    id: shapeId,
    matrix: [
      [1, 0, 0, 10],
      [0, 1, 0, 5],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ],
  })
  console.log('[16] post-recalc result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[16] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'recalc-invalidation-response')

  return { partId }
}
