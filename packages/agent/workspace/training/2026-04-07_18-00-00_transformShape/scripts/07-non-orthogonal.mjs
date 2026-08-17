// Test: non-orthogonal matrix (shear) — docs say must be orthogonal
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NonOrtho' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S' })).result

  await api.v1.curve.advancedPolyline({
    id: shapeId,
    pld: [{ xa: 0, ya: 0 }, { xa: 20, ya: 0 }, { xa: 20, ya: 10 }, { xa: 0, ya: 10 }],
    close: true,
  })

  // Shear matrix — X axis skewed by Y (non-orthogonal)
  const r = await api.v1.curve.transformShape({
    id: shapeId,
    matrix: [
      [1, 0.5, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ],
  })

  console.log('[07] non-orthogonal result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[07] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'non-orthogonal-response')

  await snapshot('07-non-ortho')

  return { partId, shapeId }
}
