// Test: what triggers constraint solving? moveGeometry? updateGeometry?
// The key question: adding constraints doesn't reposition geometry.
// Does moving one constrained element cause the solver to enforce constraints?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Two lines, no auto-constraints
  const l1 = (await api.v1.sketch.line({
    id: skId, startPos: [0, 0, 0], endPos: [50, 10, 0],
    genFixation: false, genVertAndHoriz: false,
  })).result
  const l2 = (await api.v1.sketch.line({
    id: skId, startPos: [0, 30, 0], endPos: [50, 45, 0],
    genFixation: false, genVertAndHoriz: false,
  })).result

  // Add HORIZONTAL constraint on l1 (should make it flat, but doesn't move it)
  const rH = await api.v1.sketch.constraint({ id: skId, type: 'HORIZONTAL', geomIds: [l1] })
  console.log('[11] HORIZONTAL result:', rH.result, 'maxLevel:', rH.maxLevel)

  // Add PARALLEL constraint between l1 and l2
  const rP = await api.v1.sketch.constraint({ id: skId, type: 'PARALLEL', geomIds: [l1, l2] })
  console.log('[11] PARALLEL result:', rP.result, 'maxLevel:', rP.maxLevel)

  // Check positions — should still be unmoved
  const l1Pos = await getLinePositions(api, l1)
  const l2Pos = await getLinePositions(api, l2)
  console.log('[11] BEFORE moveGeometry — l1:', l1Pos, '| l2:', l2Pos)

  await snapshot('before-move')

  // Now MOVE l1 slightly — does the solver kick in?
  const rMove = await api.v1.sketch.moveGeometry({
    id: skId, geomIds: [l1], translation: [5, 0, 0],
  })
  console.log('[11] moveGeometry result:', rMove.result, 'maxLevel:', rMove.maxLevel)

  const l1PosAfter = await getLinePositions(api, l1)
  const l2PosAfter = await getLinePositions(api, l2)
  console.log('[11] AFTER moveGeometry — l1:', l1PosAfter, '| l2:', l2PosAfter)

  await snapshot('after-move')

  filewrite({
    beforeMove: { l1: l1Pos, l2: l2Pos },
    afterMove: { l1: l1PosAfter, l2: l2PosAfter, moveResult: rMove.result },
  }, 'solver-trigger')

  return { partId }
}

async function getLinePositions(api, lineId) {
  const pts = (await api.v1.sketch.getPoints({ id: lineId })).result
  const startPos = (await api.v1.sketch.getPositions({ id: pts.startId })).result
  const endPos = (await api.v1.sketch.getPositions({ id: pts.endId })).result
  return { start: startPos, end: endPos }
}
