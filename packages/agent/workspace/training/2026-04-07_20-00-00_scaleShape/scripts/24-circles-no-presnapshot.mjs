// Test scaleShape on circles/arcs WITHOUT pre-snapshot
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CircleNoSnap' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Mixed' })).result

  // Circle at (20, 20) with radius 10
  await api.v1.curve.circle({ id: shapeId, centerPos: [20, 20, 0], radius: 10 })
  // Arc
  await api.v1.curve.arcByCenter({ id: shapeId, centerPos: [50, 20, 0], radius: 8, startAngle: 0, endAngle: Math.PI })

  // Scale 2x — NO pre-snapshot
  const r = await api.v1.curve.scaleShape({ id: shapeId, factor: 2.0 })
  console.log('[24] circle scale 2x result:', r.result, 'maxLevel:', r.maxLevel)

  // Now snapshot (post-scale is fine)
  await snapshot('circles-after-2x')

  // Get graphic data
  const rr = await api.v1.common.recalc({})
  filewrite(rr.graphic, 'circles-2x-full-graphic')

  return { partId }
}
