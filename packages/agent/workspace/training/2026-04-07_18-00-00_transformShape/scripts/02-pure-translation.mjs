// Test: pure translation via matrix
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TranslateMat' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S' })).result
  console.log('[02] partId:', partId, 'eifId:', eifId, 'shapeId:', shapeId)

  // Create a rectangle at origin
  await api.v1.curve.advancedPolyline({
    id: shapeId,
    pld: [{ xa: 0, ya: 0 }, { xa: 30, ya: 0 }, { xa: 30, ya: 20 }, { xa: 0, ya: 20 }],
    close: true,
  })

  // Pure translation: move +50 in X, +30 in Y via 4x4 matrix
  const r = await api.v1.curve.transformShape({
    id: shapeId,
    matrix: [
      [1, 0, 0, 50],
      [0, 1, 0, 30],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ],
  })

  console.log('[02] translate via matrix result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'translate-response')

  // Snapshot shows rectangle moved from origin to (50, 30)
  await snapshot('02-translated')

  return { partId, shapeId }
}
