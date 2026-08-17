// Test genTangency with an arc that is actually tangent to a horizontal line
// For tangency at (40,0,0) to a horizontal line, the arc must leave vertically
// i.e., midPos should be directly above the junction point
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TanTest2' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Horizontal line from (0,0,0) to (40,0,0)
  const lineId = (await api.v1.sketch.line({
    id: skId,
    startPos: [0, 0, 0],
    endPos: [40, 0, 0],
  })).result
  console.log('[06] lineId:', lineId)

  // Arc tangent to the line at (40,0,0) — midPos at (60,20,0), endPos at (80,0,0)
  // For true tangency, the arc should be tangent to the line direction at the junction.
  // A horizontal line ends at (40,0,0), direction is (1,0,0).
  // For tangency, the arc at start should also have direction (1,0,0).
  // midPos=(50,10,0) endPos=(40,20,0) — this might create a tangent arc
  // Actually let me think... for a semicircle from (40,0,0) through (60,20,0) to (80,0,0),
  // the center is at (60,0,0), and the tangent at (40,0,0) is vertical (0,1,0), not horizontal.
  // For tangency with a horizontal line, I need the arc to leave horizontally.
  // Center at (40,20,0), start at (40,0,0) → tangent at start is horizontal (1,0,0) ✓
  // midPos needs to be on this arc: center (40,20,0) radius 20
  // At top: (40,40,0). At right: (60,20,0). endPos could be (60,20,0).
  // midPos on the arc: (40+20*cos(45°), 20+20*sin(45°), 0) ≈ (54.14, 34.14, 0)

  const r = await api.v1.sketch.arcBy3Points({
    id: skId,
    startPos: [40, 0, 0],
    midPos: [54.142, 34.142, 0],
    endPos: [60, 20, 0],
    genTangency: 1, // TRUE
  })
  console.log('[06] arc (tangent to line):', r.result, 'maxLevel:', r.maxLevel)
  filewrite(r.structure, 'struct-tangent')

  // Check for tangency constraint
  await snapshot('tangent-arc')

  return { partId }
}
