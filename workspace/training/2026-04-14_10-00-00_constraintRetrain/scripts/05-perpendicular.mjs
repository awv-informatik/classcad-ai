// Test: PERPENDICULAR constraint — does second line become perpendicular?
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'PerpTest' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Fixed horizontal line
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [60, 0, 0] })).result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [l1] })

  // Slightly off-vertical line
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [30, 10, 0], endPos: [40, 60, 0] })).result

  const pts2 = (await api.v1.sketch.getPoints({ id: l2 })).result
  const posBefore = {
    l2Start: (await api.v1.sketch.getPositions({ id: pts2.startId })).result,
    l2End: (await api.v1.sketch.getPositions({ id: pts2.endId })).result,
  }
  console.log('[05] before l2:', JSON.stringify(posBefore))

  await snapshot('before')

  const cr = await api.v1.sketch.constraint({ id: skId, type: 'PERPENDICULAR', geomIds: [l1, l2] })
  console.log('[05] constraint result:', cr.result, 'maxLevel:', cr.maxLevel)

  const posAfter = {
    l2Start: (await api.v1.sketch.getPositions({ id: pts2.startId })).result,
    l2End: (await api.v1.sketch.getPositions({ id: pts2.endId })).result,
  }
  console.log('[05] after l2:', JSON.stringify(posAfter))

  await snapshot('after')

  // Check: is l2 now vertical (perpendicular to horizontal l1)?
  const isPerp = Math.abs(posAfter.l2Start.pos.x - posAfter.l2End.pos.x) < 0.001
  console.log('[05] isPerp:', isPerp)

  filewrite({ before: posBefore, after: posAfter, constraintResult: cr.result, maxLevel: cr.maxLevel, isPerp }, 'perp-data')

  return { partId }
}
