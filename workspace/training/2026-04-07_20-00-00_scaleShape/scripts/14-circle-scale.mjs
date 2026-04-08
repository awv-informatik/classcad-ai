// Test scaleShape with circles and arcs — does circle radius scale correctly?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CircleScale' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Mixed' })).result

  // Circle at (20, 20) with radius 10
  await api.v1.curve.circle({ id: shapeId, centerPos: [20, 20, 0], radius: 10 })
  // Arc
  await api.v1.curve.arcByCenter({ id: shapeId, centerPos: [50, 20, 0], radius: 8, startAngle: 0, endAngle: Math.PI })

  await snapshot('before-circle-scale')

  const r = await api.v1.curve.scaleShape({ id: shapeId, factor: 2.0 })
  console.log('[14] circle scale result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite(r.graphic, 'circle-scale-graphic')

  await snapshot('after-circle-scale')

  // If origin-centered scale:
  // Circle center moves from (20,20) to (40,40), radius from 10 to 20
  // Arc center moves from (50,20) to (100,40), radius from 8 to 16

  return { partId }
}
