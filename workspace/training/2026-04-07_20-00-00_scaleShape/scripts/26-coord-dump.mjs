// Precisely verify scale center and coordinate transformation
// Create shapes, scale, then snapshot to get graphic with edge points
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CoordDump' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Shape 1: line from (10,5,0) to (20,5,0) — scale 3x
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'S1' })).result
  await api.v1.curve.line({ id: s1, startPos: [10, 5, 0], endPos: [20, 5, 0] })

  // Shape 2: line from (0,0,0) to (10,0,0) — scale 3x (at origin)
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'S2' })).result
  await api.v1.curve.line({ id: s2, startPos: [0, 0, 0], endPos: [10, 0, 0] })

  // Scale both 3x — no pre-snapshot
  const r1 = await api.v1.curve.scaleShape({ id: s1, factor: 3.0 })
  const r2 = await api.v1.curve.scaleShape({ id: s2, factor: 3.0 })
  console.log('[26] s1 scale:', r1.maxLevel, 's2 scale:', r2.maxLevel)

  // Snapshot triggers recalc and builds full graphic
  const snap = await snapshot('after-scale-3x')

  // The snapshot's recalc graphic should have the final coordinates
  // Let's also try getting graphic from a structure dump
  const structR = await api.v1.common.recalc({})
  filewrite(structR.structure, 'structure-after-scale')
  filewrite(structR.graphic, 'graphic-after-scale')

  // Also capture the incremental graphic from each scale call
  filewrite(r1.graphic, 'r1-incremental-graphic')
  filewrite(r2.graphic, 'r2-incremental-graphic')

  // If origin-centered: s1 line from (30,15) to (60,15), s2 from (0,0) to (30,0)
  // If shape-centered: s1 stays around center (15,5), s2 stays around center (5,0)

  return { partId }
}
