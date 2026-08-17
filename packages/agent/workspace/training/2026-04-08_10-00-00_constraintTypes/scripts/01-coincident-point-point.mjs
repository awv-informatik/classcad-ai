// Test COINCIDENT constraint: point-point — do two separate points merge?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Two lines with separate endpoints — no auto-constraints
  const l1 = (await api.v1.sketch.line({
    id: skId, startPos: [0, 0, 0], endPos: [40, 0, 0],
    genFixation: false, genVertAndHoriz: false, genIncidence: false,
  })).result
  const l2 = (await api.v1.sketch.line({
    id: skId, startPos: [50, 10, 0], endPos: [90, 10, 0],
    genFixation: false, genVertAndHoriz: false, genIncidence: false,
  })).result

  // Get endpoint IDs
  const pts1 = (await api.v1.sketch.getPoints({ id: l1 })).result
  const pts2 = (await api.v1.sketch.getPoints({ id: l2 })).result
  console.log('[01] l1 points:', pts1, '| l2 points:', pts2)

  // Get positions BEFORE constraint
  const pos1End = (await api.v1.sketch.getPositions({ id: pts1.endId })).result
  const pos2Start = (await api.v1.sketch.getPositions({ id: pts2.startId })).result
  console.log('[01] BEFORE — l1.end:', pos1End, '| l2.start:', pos2Start)

  await snapshot('before')

  // Apply COINCIDENT: l1's end point + l2's start point
  const r = await api.v1.sketch.constraint({
    id: skId, type: 'COINCIDENT', geomIds: [pts1.endId, pts2.startId],
  })
  console.log('[01] COINCIDENT result:', r.result, 'maxLevel:', r.maxLevel)

  // Get positions AFTER
  const pos1EndAfter = (await api.v1.sketch.getPositions({ id: pts1.endId })).result
  const pos2StartAfter = (await api.v1.sketch.getPositions({ id: pts2.startId })).result
  console.log('[01] AFTER — l1.end:', pos1EndAfter, '| l2.start:', pos2StartAfter)

  filewrite({
    before: { l1End: pos1End, l2Start: pos2Start },
    after: { l1End: pos1EndAfter, l2Start: pos2StartAfter },
    constraintResult: r.result,
    maxLevel: r.maxLevel,
  }, 'coincident-point-point')

  await snapshot('after')
  return { partId }
}
