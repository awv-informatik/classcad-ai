// Test TANGENT: arc-line with fixation + move to trigger solving
// Also test CONCENTRIC properly (without getPositions on circles)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Fixed horizontal line
  const line = (await api.v1.sketch.line({
    id: skId, startPos: [0, 0, 0], endPos: [80, 0, 0],
    genFixation: false, genVertAndHoriz: false,
  })).result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [line] })

  // Arc above the line — center at (40, 25), radius ~25
  const arc = (await api.v1.sketch.arcByCenter({
    id: skId, center: [40, 25, 0], startPos: [15, 25, 0], endPos: [65, 25, 0],
    genFixation: false, genVertAndHoriz: false,
  })).result

  // Get arc positions via getPoints (arcs have startId, endId, centerId)
  const arcPts = (await api.v1.sketch.getPoints({ id: arc })).result
  console.log('[13] arc points:', arcPts)

  if (arcPts) {
    const arcCenter = (await api.v1.sketch.getPositions({ id: arcPts.centerId })).result
    const arcStart = (await api.v1.sketch.getPositions({ id: arcPts.startId })).result
    console.log('[13] arc center BEFORE:', arcCenter)
    console.log('[13] arc start BEFORE:', arcStart)
  }

  // TANGENT between arc and line
  const rT = await api.v1.sketch.constraint({ id: skId, type: 'TANGENT', geomIds: [arc, line] })
  console.log('[13] TANGENT result:', rT.result, 'maxLevel:', rT.maxLevel)
  if (rT.messages?.length) console.log('[13] tangent messages:', JSON.stringify(rT.messages))

  // Try moving the arc to trigger solving
  const rMove = await api.v1.sketch.moveGeometry({
    id: skId, geomIds: [arc], translation: [0, -5, 0],
  })
  console.log('[13] moveGeometry on arc:', rMove.result, 'maxLevel:', rMove.maxLevel)

  if (arcPts) {
    const arcCenterAfter = (await api.v1.sketch.getPositions({ id: arcPts.centerId })).result
    const arcStartAfter = (await api.v1.sketch.getPositions({ id: arcPts.startId })).result
    console.log('[13] arc center AFTER move:', arcCenterAfter)
    console.log('[13] arc start AFTER move:', arcStartAfter)

    filewrite({
      tangent: { result: rT.result, maxLevel: rT.maxLevel },
      moveResult: rMove.result,
      arcCenterAfter, arcStartAfter,
    }, 'tangent-data')
  }

  await snapshot('tangent-result')
  return { partId }
}
