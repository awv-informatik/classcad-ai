// Script 19: The fundamental parametric test
// Create a rectangle, dimension it, change the dimension. Does it resize?
// Also test: add COINCIDENT to two separate lines, add dimensions to both,
// then change a dimension. Does the solver enforce the coincident constraint?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // ====== TEST A: Rectangle + dimension resize ======
  console.log('=== TEST A: Rectangle resize via dimension ===')

  // Create a rectangle 60×40
  const rect = (await api.v1.sketch.rectangle({
    id: skId, startPos: [0, 0, 0], endPos: [60, 40, 0],
  })).result
  console.log('[19A] rect lines:', rect)

  // Get the bottom line's length via positions
  const pts0 = (await api.v1.sketch.getPoints({ id: rect[0] })).result
  const pos0s = (await api.v1.sketch.getPositions({ id: pts0.startId })).result
  const pos0e = (await api.v1.sketch.getPositions({ id: pts0.endId })).result
  console.log('[19A] bottom line: (%s,%s)→(%s,%s)',
    pos0s.pos.x, pos0s.pos.y, pos0e.pos.x, pos0e.pos.y)

  await snapshot('before-resize')

  // Add OFFSET dimension on bottom line (should auto-calculate to 60)
  const dimId = (await api.v1.sketch.dimension({
    id: skId, type: 'OFFSET', geomIds: [rect[0]],
  })).result
  console.log('[19A] dimension ID:', dimId)

  // Now change dimension to 100 — does the rectangle resize?
  const updR = await api.v1.sketch.updateDimension({ id: dimId, value: 100 })
  console.log('[19A] updateDimension(100) result:', updR.result, '(0=unsolved, 1=solved)')

  // Check the line's new positions
  const pos0sAfter = (await api.v1.sketch.getPositions({ id: pts0.startId })).result
  const pos0eAfter = (await api.v1.sketch.getPositions({ id: pts0.endId })).result
  console.log('[19A] after resize: (%s,%s)→(%s,%s)',
    pos0sAfter.pos.x, pos0sAfter.pos.y, pos0eAfter.pos.x, pos0eAfter.pos.y)

  const widthBefore = Math.abs(pos0e.pos.x - pos0s.pos.x)
  const widthAfter = Math.abs(pos0eAfter.pos.x - pos0sAfter.pos.x)
  console.log('[19A] width before=%d, after=%d, changed=%s', widthBefore, widthAfter, widthBefore !== widthAfter)

  // Also check the right side line (should also move if solver works)
  const pts1 = (await api.v1.sketch.getPoints({ id: rect[1] })).result
  const pos1sAfter = (await api.v1.sketch.getPositions({ id: pts1.startId })).result
  console.log('[19A] right line start after: (%s,%s)', pos1sAfter.pos.x, pos1sAfter.pos.y)

  await snapshot('after-resize')

  // ====== TEST B: Try recalc after updateDimension ======
  console.log('\n=== TEST B: recalc after updateDimension ===')
  await api.v1.common.recalc({})
  const pos0sRecalc = (await api.v1.sketch.getPositions({ id: pts0.startId })).result
  const pos0eRecalc = (await api.v1.sketch.getPositions({ id: pts0.endId })).result
  console.log('[19B] after recalc: (%s,%s)→(%s,%s)',
    pos0sRecalc.pos.x, pos0sRecalc.pos.y, pos0eRecalc.pos.x, pos0eRecalc.pos.y)
  const widthRecalc = Math.abs(pos0eRecalc.pos.x - pos0sRecalc.pos.x)
  console.log('[19B] width after recalc: %d', widthRecalc)

  await snapshot('after-recalc')

  filewrite({
    testA: {
      before: { width: widthBefore, start: pos0s, end: pos0e },
      afterDimUpdate: { width: widthAfter, start: pos0sAfter, end: pos0eAfter, solverResult: updR.result },
    },
    testB: {
      afterRecalc: { width: widthRecalc, start: pos0sRecalc, end: pos0eRecalc },
    },
  }, 'parametric-resize')

  return { partId }
}
