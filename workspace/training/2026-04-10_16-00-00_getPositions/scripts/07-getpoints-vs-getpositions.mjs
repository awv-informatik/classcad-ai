// Compare: getPositions on curve directly vs getPoints → getPositions on each point
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [10, 20, 0], endPos: [70, 60, 0] })).result

  // Method 1: getPositions directly on line
  const direct = (await api.v1.sketch.getPositions({ id: lineId })).result
  console.log('[07] direct:', JSON.stringify(direct))

  // Method 2: getPoints → getPositions on each point
  const pts = (await api.v1.sketch.getPoints({ id: lineId })).result
  const startPosVia = (await api.v1.sketch.getPositions({ id: pts.startId })).result
  const endPosVia = (await api.v1.sketch.getPositions({ id: pts.endId })).result
  console.log('[07] via getPoints start:', JSON.stringify(startPosVia))
  console.log('[07] via getPoints end:', JSON.stringify(endPosVia))

  // Compare
  const startMatch = JSON.stringify(direct.startPos) === JSON.stringify(startPosVia.pos)
  const endMatch = JSON.stringify(direct.endPos) === JSON.stringify(endPosVia.pos)
  console.log('[07] startPos match:', startMatch, '| endPos match:', endMatch)

  filewrite({ direct, viaGetPoints: { start: startPosVia, end: endPosVia }, startMatch, endMatch }, 'comparison')

  return { partId }
}
