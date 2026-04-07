// Test normal parameter — ellipse plane orientation
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NormalTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S1' })).result

  // Default normal [0,0,1] — XY plane
  const r1 = await api.v1.curve.ellipse({ id: shapeId, centerPos: [0, 0, 0], radius1: 25, radius2: 10 })
  console.log('[04] default normal: maxLevel:', r1.maxLevel)

  // Normal [1,0,0] — YZ plane
  const r2 = await api.v1.curve.ellipse({ id: shapeId, centerPos: [50, 0, 0], radius1: 25, radius2: 10, normal: [1, 0, 0] })
  console.log('[04] normal=[1,0,0]: maxLevel:', r2.maxLevel)

  // Normal [0,1,0] — XZ plane
  const r3 = await api.v1.curve.ellipse({ id: shapeId, centerPos: [0, 50, 0], radius1: 25, radius2: 10, normal: [0, 1, 0] })
  console.log('[04] normal=[0,1,0]: maxLevel:', r3.maxLevel)

  await snapshot('normal-variants')
  return { partId }
}
