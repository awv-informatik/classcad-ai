// Test SYMMETRY with line pairs (not just points)
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'SymmetryLines' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Vertical axis line at x=40
  const axisId = (await api.v1.sketch.line({ id: skId, startPos: [40, -10, 0], endPos: [40, 60, 0] })).result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [axisId] })

  // Line 1 on the left, fixed
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [10, 10, 0], endPos: [25, 40, 0] })).result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [l1] })

  // Line 2 on the right (not symmetric yet)
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [60, 15, 0], endPos: [80, 35, 0] })).result
  console.log('[05] axis:', axisId, 'l1:', l1, 'l2:', l2)

  // Get positions before
  const l1pts = (await api.v1.sketch.getPoints({ id: l1 })).result
  const l2pts = (await api.v1.sketch.getPoints({ id: l2 })).result
  const l2startBefore = (await api.v1.sketch.getPositions({ id: l2pts.startId })).result
  const l2endBefore = (await api.v1.sketch.getPositions({ id: l2pts.endId })).result
  console.log('[05] l2 before: start', JSON.stringify(l2startBefore.pos), 'end', JSON.stringify(l2endBefore.pos))

  await snapshot('before')

  // SYMMETRY: [axis, l1, l2] — l2 should mirror l1
  const r = await api.v1.sketch.constraint({ id: skId, type: 'SYMMETRY', geomIds: [axisId, l1, l2] })
  console.log('[05] SYMMETRY lines result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages) r.messages.forEach(m => console.log('[05] msg:', m.message, 'level:', m.level))

  const l2startAfter = (await api.v1.sketch.getPositions({ id: l2pts.startId })).result
  const l2endAfter = (await api.v1.sketch.getPositions({ id: l2pts.endId })).result
  console.log('[05] l2 after: start', JSON.stringify(l2startAfter.pos), 'end', JSON.stringify(l2endAfter.pos))

  await snapshot('after')

  // Expected: l1 start (10,10) mirrors to (70,10) about x=40
  // l1 end (25,40) mirrors to (55,40) about x=40
  const l1s = (await api.v1.sketch.getPositions({ id: l1pts.startId })).result.pos
  const l1e = (await api.v1.sketch.getPositions({ id: l1pts.endId })).result.pos
  const expectedStart = [2 * 40 - l1s.x, l1s.y, 0]
  const expectedEnd = [2 * 40 - l1e.x, l1e.y, 0]

  filewrite({
    constraintResult: r.result,
    maxLevel: r.maxLevel,
    l1: { start: [l1s.x, l1s.y], end: [l1e.x, l1e.y] },
    l2before: { start: [l2startBefore.pos.x, l2startBefore.pos.y], end: [l2endBefore.pos.x, l2endBefore.pos.y] },
    l2after: { start: [l2startAfter.pos.x, l2startAfter.pos.y], end: [l2endAfter.pos.x, l2endAfter.pos.y] },
    expected: { start: expectedStart, end: expectedEnd },
    startMatch: Math.abs(l2startAfter.pos.x - expectedStart[0]) < 0.5 && Math.abs(l2startAfter.pos.y - expectedStart[1]) < 0.5,
    endMatch: Math.abs(l2endAfter.pos.x - expectedEnd[0]) < 0.5 && Math.abs(l2endAfter.pos.y - expectedEnd[1]) < 0.5
  }, 'symmetry-lines')

  return { partId }
}
