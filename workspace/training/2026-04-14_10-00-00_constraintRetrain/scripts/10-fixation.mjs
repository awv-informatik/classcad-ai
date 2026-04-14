// Test: FIXATION — does it prevent geometry from moving during solving?
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'FixTest' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Two lines: one diagonal that we'll fix, one that should be made parallel
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [60, 20, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [0, 40, 0], endPos: [50, 70, 0] })).result

  // Fix l1
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [l1] })

  const pts1 = (await api.v1.sketch.getPoints({ id: l1 })).result
  const pts2 = (await api.v1.sketch.getPoints({ id: l2 })).result

  const posBefore = {
    l1Start: (await api.v1.sketch.getPositions({ id: pts1.startId })).result,
    l1End: (await api.v1.sketch.getPositions({ id: pts1.endId })).result,
    l2Start: (await api.v1.sketch.getPositions({ id: pts2.startId })).result,
    l2End: (await api.v1.sketch.getPositions({ id: pts2.endId })).result,
  }

  // Now add PARALLEL: l2 should adjust to be parallel to l1, but l1 should NOT move
  const cr = await api.v1.sketch.constraint({ id: skId, type: 'PARALLEL', geomIds: [l1, l2] })
  console.log('[10] parallel result:', cr.result, 'maxLevel:', cr.maxLevel)

  const posAfter = {
    l1Start: (await api.v1.sketch.getPositions({ id: pts1.startId })).result,
    l1End: (await api.v1.sketch.getPositions({ id: pts1.endId })).result,
    l2Start: (await api.v1.sketch.getPositions({ id: pts2.startId })).result,
    l2End: (await api.v1.sketch.getPositions({ id: pts2.endId })).result,
  }

  const l1Moved = posBefore.l1Start.pos.x !== posAfter.l1Start.pos.x || posBefore.l1End.pos.y !== posAfter.l1End.pos.y
  const l2Moved = posBefore.l2Start.pos.x !== posAfter.l2Start.pos.x || posBefore.l2End.pos.y !== posAfter.l2End.pos.y
  console.log('[10] l1Moved:', l1Moved, 'l2Moved:', l2Moved)

  await snapshot('result')

  filewrite({ before: posBefore, after: posAfter, l1Moved, l2Moved, constraintResult: cr.result, maxLevel: cr.maxLevel }, 'fixation-data')

  return { partId }
}
