// Test: PARALLEL constraint — does second line become parallel?
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'ParallelTest' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Fixed horizontal reference line
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [60, 0, 0] })).result
  // Fix it so it doesn't move
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [l1] })

  // Diagonal line (not parallel to l1)
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [0, 30, 0], endPos: [60, 50, 0] })).result

  const pts2 = (await api.v1.sketch.getPoints({ id: l2 })).result
  const posBefore = {
    l2Start: (await api.v1.sketch.getPositions({ id: pts2.startId })).result,
    l2End: (await api.v1.sketch.getPositions({ id: pts2.endId })).result,
  }
  console.log('[04] before l2:', JSON.stringify(posBefore))

  await snapshot('before')

  // Constrain PARALLEL
  const cr = await api.v1.sketch.constraint({ id: skId, type: 'PARALLEL', geomIds: [l1, l2] })
  console.log('[04] constraint result:', cr.result, 'maxLevel:', cr.maxLevel)

  const posAfter = {
    l2Start: (await api.v1.sketch.getPositions({ id: pts2.startId })).result,
    l2End: (await api.v1.sketch.getPositions({ id: pts2.endId })).result,
  }
  console.log('[04] after l2:', JSON.stringify(posAfter))

  await snapshot('after')

  // Check: are start.y and end.y now equal (parallel to horizontal)?
  const isParallel = Math.abs(posAfter.l2Start.pos.y - posAfter.l2End.pos.y) < 0.001
  console.log('[04] isParallel:', isParallel)

  filewrite({ before: posBefore, after: posAfter, constraintResult: cr.result, maxLevel: cr.maxLevel, isParallel }, 'parallel-data')

  return { partId }
}
