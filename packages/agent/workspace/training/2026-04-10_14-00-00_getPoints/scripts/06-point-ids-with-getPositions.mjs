// Test: are point IDs from getPoints usable with getPositions?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a line
  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [10, 20, 0], endPos: [70, 60, 0] })).result
  console.log('[06] lineId:', lineId)

  // Get point IDs
  const pts = (await api.v1.sketch.getPoints({ id: lineId })).result
  console.log('[06] getPoints:', JSON.stringify(pts))

  // Use those point IDs with getPositions
  const startPos = await api.v1.sketch.getPositions({ id: pts.startId })
  const endPos = await api.v1.sketch.getPositions({ id: pts.endId })
  console.log('[06] startPos:', JSON.stringify(startPos.result))
  console.log('[06] endPos:', JSON.stringify(endPos.result))

  filewrite({
    lineId,
    pointIds: pts,
    startPosition: startPos.result,
    endPosition: endPos.result,
    startMaxLevel: startPos.maxLevel,
    endMaxLevel: endPos.maxLevel
  }, 'points-to-positions')

  // Also test: getPositions on the line itself (for comparison)
  const linePos = await api.v1.sketch.getPositions({ id: lineId })
  console.log('[06] linePos (direct):', JSON.stringify(linePos.result))

  filewrite({
    directLinePositions: linePos.result,
    viaPoints: { start: startPos.result, end: endPos.result }
  }, 'positions-comparison')

  return { partId }
}
