// Test radius1 vs radius2 relationship: equal, swapped, r1 < r2
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RadiusTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S1' })).result

  // r1 > r2 (standard)
  const r1 = await api.v1.curve.ellipse({ id: shapeId, centerPos: [-40, 0, 0], radius1: 30, radius2: 15 })
  console.log('[02] r1>r2: maxLevel:', r1.maxLevel)

  // r1 < r2 (swapped — is this allowed?)
  const r2 = await api.v1.curve.ellipse({ id: shapeId, centerPos: [40, 0, 0], radius1: 10, radius2: 25 })
  console.log('[02] r1<r2: maxLevel:', r2.maxLevel)

  // r1 == r2 (circle)
  const r3 = await api.v1.curve.ellipse({ id: shapeId, centerPos: [0, 40, 0], radius1: 20, radius2: 20 })
  console.log('[02] r1==r2: maxLevel:', r3.maxLevel)

  await snapshot('radius-variants')
  return { partId }
}
