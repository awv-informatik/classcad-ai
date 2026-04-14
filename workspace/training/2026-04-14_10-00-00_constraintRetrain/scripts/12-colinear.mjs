// Test: COLINEAR — does second line move onto the same infinite line as the first?
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'ColinearTest' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Fixed horizontal line
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [40, 0, 0] })).result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [l1] })

  // Second line, offset vertically (not colinear)
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [60, 15, 0], endPos: [100, 10, 0] })).result

  const pts2 = (await api.v1.sketch.getPoints({ id: l2 })).result
  const posBefore = {
    l2Start: (await api.v1.sketch.getPositions({ id: pts2.startId })).result,
    l2End: (await api.v1.sketch.getPositions({ id: pts2.endId })).result,
  }
  console.log('[12] before l2:', JSON.stringify(posBefore))

  await snapshot('before')

  const cr = await api.v1.sketch.constraint({ id: skId, type: 'COLINEAR', geomIds: [l1, l2] })
  console.log('[12] constraint result:', cr.result, 'maxLevel:', cr.maxLevel)

  const posAfter = {
    l2Start: (await api.v1.sketch.getPositions({ id: pts2.startId })).result,
    l2End: (await api.v1.sketch.getPositions({ id: pts2.endId })).result,
  }
  console.log('[12] after l2:', JSON.stringify(posAfter))

  await snapshot('after')

  // l2 should now be on y=0 (same as l1)
  const isColinear = Math.abs(posAfter.l2Start.pos.y) < 0.01 && Math.abs(posAfter.l2End.pos.y) < 0.01
  console.log('[12] isColinear:', isColinear)

  filewrite({ before: posBefore, after: posAfter, constraintResult: cr.result, maxLevel: cr.maxLevel, isColinear }, 'colinear-data')

  return { partId }
}
