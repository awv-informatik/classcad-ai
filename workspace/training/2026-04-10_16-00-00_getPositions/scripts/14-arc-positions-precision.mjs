// Check floating-point precision on arc positions — getPoints doc mentions minor noise
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Arc with non-trivial geometry
  const arcId = (await api.v1.sketch.arcByCenter({
    id: skId, startPos: [10, 0, 0], endPos: [0, 10, 0], centerPos: [0, 0, 0],
  })).result

  // Direct positions
  const direct = (await api.v1.sketch.getPositions({ id: arcId })).result
  console.log('[14] direct:', JSON.stringify(direct))

  // Via getPoints
  const pts = (await api.v1.sketch.getPoints({ id: arcId })).result
  const startVia = (await api.v1.sketch.getPositions({ id: pts.startId })).result
  const endVia = (await api.v1.sketch.getPositions({ id: pts.endId })).result
  const centerVia = (await api.v1.sketch.getPositions({ id: pts.centerId })).result
  console.log('[14] via start:', JSON.stringify(startVia))
  console.log('[14] via end:', JSON.stringify(endVia))
  console.log('[14] via center:', JSON.stringify(centerVia))

  // Check for precision differences
  const startMatch = JSON.stringify(direct.startPos) === JSON.stringify(startVia.pos)
  const endMatch = JSON.stringify(direct.endPos) === JSON.stringify(endVia.pos)
  const centerMatch = JSON.stringify(direct.centerPos) === JSON.stringify(centerVia.pos)
  console.log('[14] matches — start:', startMatch, 'end:', endMatch, 'center:', centerMatch)

  filewrite({ direct, viaGetPoints: { start: startVia, end: endVia, center: centerVia }, startMatch, endMatch, centerMatch }, 'arc-precision')

  return { partId }
}
