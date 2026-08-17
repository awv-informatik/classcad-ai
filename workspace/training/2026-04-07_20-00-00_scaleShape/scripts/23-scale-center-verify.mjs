// Verify scale center by creating an offset shape, scaling 3x, then checking final graphic
// NO snapshot before scale
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CenterVerify' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Offset' })).result

  // Line from (10, 5, 0) to (20, 5, 0) — offset from origin
  await api.v1.curve.line({ id: shapeId, startPos: [10, 5, 0], endPos: [20, 5, 0] })

  // Scale 3x — NO pre-snapshot
  const r = await api.v1.curve.scaleShape({ id: shapeId, factor: 3.0 })
  console.log('[23] scale 3x result:', r.result, 'maxLevel:', r.maxLevel)

  // Now snapshot to get final graphic
  await snapshot('after-offset-scale-3x')

  // Get full graphic via recalc
  const rr = await api.v1.common.recalc({})
  filewrite(rr.graphic, 'offset-3x-full-graphic')

  // If origin-centered: line should be (30, 15, 0) to (60, 15, 0)
  // If shape-centered: line should be (5, 5, 0) to (35, 5, 0) or similar

  return { partId }
}
