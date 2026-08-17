// Test: does the same bulge produce the same angle regardless of segment length?
// Same 90° bulge on short (10 units) vs long (100 units) segments
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SegmentLength' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const b90 = Math.tan(Math.PI / 8) // 90° bulge

  // Short segment (10 units)
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'short' })).result
  const r1 = await api.v1.curve.polyline2d({
    id: s1,
    points: [[0, 0, 0], [10, 0, 0]],
    bulges: [b90, 0],
  })

  // Long segment (100 units)
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'long' })).result
  const r2 = await api.v1.curve.polyline2d({
    id: s2,
    points: [[0, -30, 0], [100, -30, 0]],
    bulges: [b90, 0],
  })

  console.log('[06] short segment maxLevel:', r1.maxLevel)
  console.log('[06] long segment maxLevel:', r2.maxLevel)

  // Dump graphics to compare — the arc angle should be the same
  // even though the arc radius and sagitta differ
  filewrite(r1.graphic, 'short-graphic')
  filewrite(r2.graphic, 'long-graphic')

  await snapshot('segment-length')
  return { partId }
}
