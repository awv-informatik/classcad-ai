// 15 — Test isClockwise with literal TRUE/true/1 values
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ArcTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S1' })).result

  // isClockwise: true (JS boolean)
  const r1 = await api.v1.curve.arcByCenter({
    id: shapeId,
    centerPos: [0, 0, 0],
    startPos: [15, 0, 0],
    endPos: [0, 15, 0],
    isClockwise: true,
  })
  console.log('[15a] true (boolean):', r1.maxLevel)

  // isClockwise: 1 (number)
  const r2 = await api.v1.curve.arcByCenter({
    id: shapeId,
    centerPos: [50, 0, 0],
    startPos: [65, 0, 0],
    endPos: [50, 15, 0],
    isClockwise: 1,
  })
  console.log('[15b] 1 (number):', r2.maxLevel)

  // isClockwise: 0 (should be same as false)
  const r3 = await api.v1.curve.arcByCenter({
    id: shapeId,
    centerPos: [100, 0, 0],
    startPos: [115, 0, 0],
    endPos: [100, 15, 0],
    isClockwise: 0,
  })
  console.log('[15c] 0 (number):', r3.maxLevel)

  await snapshot('isClockwise-variants')
  return { partId, shapeId }
}
