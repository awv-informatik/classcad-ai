// Test: Get actual positions of split segments to understand boundary value behavior
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'PositionCheck' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Line from (-50,0,0) to (50,0,0)
  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [-50, 0, 0], endPos: [50, 0, 0] })).result

  // Split at -0.5, 0.5, 1.5
  const r = await api.v1.sketch.splitCurves({
    id: skId,
    splits: [{ geomId: lineId, values: [-0.5, 0.5, 1.5] }]
  })

  const segments = r.result[0]
  const results = []

  for (const segId of segments) {
    const pts = await api.v1.sketch.getPoints({ id: segId })
    const pos = await api.v1.sketch.getPositions({ id: segId })
    results.push({
      id: segId,
      pointIds: pts.result,
      positions: pos.result
    })
    console.log(`[18] seg ${segId}: positions=${JSON.stringify(pos.result)}`)
  }

  filewrite(results, 'segment-positions')

  // Also test: split at 0.0 (start)
  const partId2 = (await api.v1.part.create({ name: 'SplitAt0' })).result
  const skId2 = (await api.v1.sketch.create({ id: partId2 })).result
  const lineId2 = (await api.v1.sketch.line({ id: skId2, startPos: [-50, 0, 0], endPos: [50, 0, 0] })).result
  const r2 = await api.v1.sketch.splitCurves({
    id: skId2,
    splits: [{ geomId: lineId2, values: [0.0] }]
  })
  console.log('[18] split at 0.0:', JSON.stringify(r2.result))
  if (r2.result) {
    for (const segId of r2.result[0]) {
      const pos = await api.v1.sketch.getPositions({ id: segId })
      console.log(`[18] seg ${segId} at-0: positions=${JSON.stringify(pos.result)}`)
    }
  }

  return { partId }
}
