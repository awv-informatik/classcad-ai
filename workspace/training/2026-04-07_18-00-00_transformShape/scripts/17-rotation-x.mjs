// Test: rotation around X axis via matrix (90° — lifts shape out of XY plane)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RotX' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S' })).result

  await api.v1.curve.advancedPolyline({
    id: shapeId,
    pld: [{ xa: 0, ya: 0 }, { xa: 30, ya: 0 }, { xa: 30, ya: 15 }, { xa: 0, ya: 15 }],
    close: true,
  })

  // 90° rotation around X: y→z, z→-y
  const r = await api.v1.curve.transformShape({
    id: shapeId,
    matrix: [
      [1, 0, 0, 0],
      [0, 0, -1, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 1],
    ],
  })
  console.log('[17] rot X 90° result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'rot-x-response')

  await snapshot('17-rot-x')

  return { partId }
}
