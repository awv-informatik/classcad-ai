// Test: left-handed transformation matrix — docs say not supported
// A left-handed matrix has a negative determinant (upper 3x3)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'LeftHanded' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S' })).result

  await api.v1.curve.advancedPolyline({
    id: shapeId,
    pld: [{ xa: 0, ya: 0 }, { xa: 20, ya: 0 }, { xa: 20, ya: 10 }, { xa: 0, ya: 10 }],
    close: true,
  })

  // Mirror in X axis (reflection) — determinant = -1 (left-handed)
  const r = await api.v1.curve.transformShape({
    id: shapeId,
    matrix: [
      [-1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ],
  })

  console.log('[08] left-handed result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[08] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'left-handed-response')

  await snapshot('08-left-handed')

  return { partId, shapeId }
}
