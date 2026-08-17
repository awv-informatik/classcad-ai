// 09 — Deep structure inspection: what nodes does an arc create, ID consumption
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'StructTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Get ID baseline before arc
  const geo0 = (await api.v1.sketch.getGeometry({ id: skId })).result
  console.log('[09] geometry before:', JSON.stringify(geo0))

  const r = await api.v1.sketch.arcByCenter({
    id: skId,
    startPos: [-40, 0, 0],
    centerPos: [0, 0, 0],
    endPos: [40, 0, 0],
  })
  const arcId = r.result
  console.log('[09] arc id:', arcId)

  // getPoints to see sub-IDs
  const pts = (await api.v1.sketch.getPoints({ id: arcId })).result
  console.log('[09] getPoints:', JSON.stringify(pts))
  console.log('[09] IDs: arc=', arcId, 'start=', pts.startId, 'end=', pts.endId, 'center=', pts.centerId)
  console.log('[09] ID gap: arc→start=', pts.startId - arcId, 'arc→end=', pts.endId - arcId, 'arc→center=', pts.centerId - arcId)

  // Create a second arc to see ID increment between arcs
  const r2 = await api.v1.sketch.arcByCenter({
    id: skId,
    startPos: [-40, -60, 0],
    centerPos: [0, -60, 0],
    endPos: [40, -60, 0],
  })
  const arcId2 = r2.result
  const pts2 = (await api.v1.sketch.getPoints({ id: arcId2 })).result
  console.log('[09] arc2 id:', arcId2, 'points:', JSON.stringify(pts2))
  console.log('[09] ID gap between arcs:', arcId2 - arcId)

  // Dump structure tree for detailed inspection
  // Filter to sketch children only
  const sketchNode = r2.structure?.find?.(n => n.id === skId)
  filewrite(r2.structure, 'full-structure')

  return { partId }
}
