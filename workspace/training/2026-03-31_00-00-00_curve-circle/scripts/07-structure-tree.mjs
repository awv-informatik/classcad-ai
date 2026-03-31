export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CirclePart' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Circles' })).result

  // Create a circle and dump the structure
  const r = await api.v1.curve.circle({ id: shapeId, centerPos: [10, 20, 0], radius: 15 })
  console.log('[07] result:', r.result, 'maxLevel:', r.maxLevel)

  filewrite(r.structure, 'structure-after-circle')

  // Add a second circle and dump again
  const r2 = await api.v1.curve.circle({ id: shapeId, centerPos: [50, 30, 0], radius: 8 })
  filewrite(r2.structure, 'structure-after-two-circles')

  return { partId, shapeId }
}
