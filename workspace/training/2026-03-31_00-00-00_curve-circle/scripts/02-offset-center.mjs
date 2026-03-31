export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CirclePart' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Circles' })).result

  // Circle with offset center
  const r = await api.v1.curve.circle({ id: shapeId, centerPos: [30, 20, 0], radius: 15 })
  console.log('[02] result:', r.result, 'maxLevel:', r.maxLevel)

  // Second circle at different position
  const r2 = await api.v1.curve.circle({ id: shapeId, centerPos: [-20, -10, 0], radius: 10 })
  console.log('[02] second circle result:', r2.result, 'maxLevel:', r2.maxLevel)

  await snapshot('two-circles')
  return { partId, shapeId }
}
