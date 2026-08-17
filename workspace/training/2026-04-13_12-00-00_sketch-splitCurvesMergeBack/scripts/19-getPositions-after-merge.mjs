// After trimming and merging, do the new curve segments have correct positions?
// Use getPositions to verify endpoint coordinates
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Positions' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Horizontal line and a circle
  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [-50, 0, 0], endPos: [50, 0, 0] })).result
  const circleId = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 30 })).result
  console.log('[19] lineId:', lineId, 'circleId:', circleId)

  // Split
  const splitIds = (await api.v1.sketch.splitAllCurves({ id: skId })).result
  console.log('[19] splitIds:', JSON.stringify(splitIds))

  // Trim middle line segment (inside the circle)
  // Line → 3 parts: left (outside), middle (inside), right (outside)
  // Circle → 2 arcs: upper, lower
  // Expected order: [circArc0, circArc1, linePart0, linePart1, linePart2]
  console.log('[19] trimming index 3 (expected middle line segment)')
  await api.v1.sketch.trimCurves({ id: skId, curveIds: [splitIds[3]] })

  // mergeBack
  await api.v1.sketch.splitCurvesMergeBack({ id: skId })

  // Get remaining geometry
  const geom = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[19] geomAfter:', JSON.stringify(geom.result))

  // Get positions of remaining lines
  for (const lineId of (geom.result?.lines || [])) {
    const pos = await api.v1.sketch.getPositions({ id: lineId })
    console.log('[19] line', lineId, 'positions:', JSON.stringify(pos.result))
  }

  // Get positions of remaining arcs
  for (const arcId of (geom.result?.arcs || [])) {
    const pos = await api.v1.sketch.getPositions({ id: arcId })
    console.log('[19] arc', arcId, 'positions:', JSON.stringify(pos.result))
  }

  for (const circId of (geom.result?.circles || [])) {
    const pos = await api.v1.sketch.getPositions({ id: circId })
    console.log('[19] circle', circId, 'positions:', JSON.stringify(pos.result))
  }

  return { partId }
}
