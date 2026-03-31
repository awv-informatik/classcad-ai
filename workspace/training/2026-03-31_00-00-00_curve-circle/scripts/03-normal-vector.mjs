export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CirclePart' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Circles' })).result

  // Default normal [0,0,1] — XY plane
  const r1 = await api.v1.curve.circle({ id: shapeId, centerPos: [0, 0, 0], radius: 20 })
  console.log('[03] XY plane circle maxLevel:', r1.maxLevel)

  // Explicit normal [0,0,1] — should be same as default
  const r2 = await api.v1.curve.circle({ id: shapeId, centerPos: [50, 0, 0], radius: 15, normal: [0, 0, 1] })
  console.log('[03] explicit [0,0,1] maxLevel:', r2.maxLevel)

  // Normal [1,0,0] — YZ plane
  const r3 = await api.v1.curve.circle({ id: shapeId, centerPos: [0, 50, 0], radius: 15, normal: [1, 0, 0] })
  console.log('[03] YZ plane [1,0,0] maxLevel:', r3.maxLevel)

  // Normal [0,1,0] — XZ plane
  const r4 = await api.v1.curve.circle({ id: shapeId, centerPos: [0, 0, 50], radius: 15, normal: [0, 1, 0] })
  console.log('[03] XZ plane [0,1,0] maxLevel:', r4.maxLevel)

  // Tilted normal [1,1,1]
  const r5 = await api.v1.curve.circle({ id: shapeId, centerPos: [50, 50, 0], radius: 15, normal: [1, 1, 1] })
  console.log('[03] tilted [1,1,1] maxLevel:', r5.maxLevel)

  await snapshot('normals')
  return { partId, shapeId }
}
