// Test getGeometry with sketch-curve and sketch-point IDs (discovered from error message)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a line and circle
  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0] })).result
  const circId = (await api.v1.sketch.circle({ id: skId, centerPos: [25, 25, 0], radius: 10 })).result

  console.log('[10] lineId:', lineId, 'circId:', circId)

  // Try getGeometry with lineId (a sketch-curve)
  const r1 = await api.v1.sketch.getGeometry({ id: lineId })
  console.log('[10] getGeometry(lineId):', JSON.stringify(r1.result), 'maxLevel:', r1.maxLevel)

  // Try getGeometry with circleId (a sketch-circle / sketch-curve)
  const r2 = await api.v1.sketch.getGeometry({ id: circId })
  console.log('[10] getGeometry(circId):', JSON.stringify(r2.result), 'maxLevel:', r2.maxLevel)

  // Get points of the line to try with a sketch-point
  const pts = await api.v1.sketch.getPoints({ id: lineId })
  console.log('[10] line points:', JSON.stringify(pts.result))

  if (pts.result && (pts.result.startId || pts.result[0])) {
    const ptId = pts.result.startId || pts.result[0]
    const r3 = await api.v1.sketch.getGeometry({ id: ptId })
    console.log('[10] getGeometry(pointId):', JSON.stringify(r3.result), 'maxLevel:', r3.maxLevel)
    filewrite({
      lineResult: { result: r1.result, maxLevel: r1.maxLevel },
      circResult: { result: r2.result, maxLevel: r2.maxLevel },
      pointResult: { result: r3.result, maxLevel: r3.maxLevel },
      pointId: ptId,
    }, 'curve-point-ids')
  } else {
    filewrite({
      lineResult: { result: r1.result, maxLevel: r1.maxLevel },
      circResult: { result: r2.result, maxLevel: r2.maxLevel },
      getPointsResult: pts.result,
    }, 'curve-point-ids')
  }

  return { partId, skId }
}
