// Test: arc getPoints centerId with getPositions
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const arcId = (await api.v1.sketch.arcByCenter({
    id: skId,
    centerPos: [50, 40, 0],
    startPos: [80, 40, 0],
    endPos: [50, 70, 0]
  })).result

  // Get point IDs from arc
  const pts = (await api.v1.sketch.getPoints({ id: arcId })).result
  console.log('[07] arc getPoints:', JSON.stringify(pts))

  // Resolve all point IDs to positions
  const startPos = (await api.v1.sketch.getPositions({ id: pts.startId })).result
  const endPos = (await api.v1.sketch.getPositions({ id: pts.endId })).result
  const centerPos = (await api.v1.sketch.getPositions({ id: pts.centerId })).result
  console.log('[07] startPos:', JSON.stringify(startPos))
  console.log('[07] endPos:', JSON.stringify(endPos))
  console.log('[07] centerPos:', JSON.stringify(centerPos))

  // Compare with direct getPositions on arc
  const arcPos = (await api.v1.sketch.getPositions({ id: arcId })).result
  console.log('[07] arcPos (direct):', JSON.stringify(arcPos))

  filewrite({
    arcId,
    pointIds: pts,
    resolvedPositions: { start: startPos, end: endPos, center: centerPos },
    directArcPositions: arcPos
  }, 'arc-points-positions')

  return { partId }
}
