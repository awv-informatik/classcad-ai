// Test: are multiple transformShape calls cumulative?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Cumulative' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S' })).result

  await api.v1.curve.advancedPolyline({
    id: shapeId,
    pld: [{ xa: 0, ya: 0 }, { xa: 20, ya: 0 }, { xa: 20, ya: 10 }, { xa: 0, ya: 10 }],
    close: true,
  })

  // First transform: translate +30 in X
  const r1 = await api.v1.curve.transformShape({
    id: shapeId,
    matrix: [
      [1, 0, 0, 30],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ],
  })
  console.log('[05] first transform result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Second transform: translate +30 in Y
  const r2 = await api.v1.curve.transformShape({
    id: shapeId,
    matrix: [
      [1, 0, 0, 0],
      [0, 1, 0, 30],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ],
  })
  console.log('[05] second transform result:', r2.result, 'maxLevel:', r2.maxLevel)

  // If cumulative, rect should now be at (30, 30)
  // If absolute/overwriting, rect should be at (0, 30)
  await snapshot('05-cumulative')

  return { partId, shapeId }
}
