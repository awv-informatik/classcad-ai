// Follow-up: EQUAL_LENGTH with more constraints — fix l2.start so solver has a direction to extend
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'EqLen2' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Fixed line of length 60
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [60, 0, 0] })).result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [l1] })

  // Short HORIZONTAL line of length 30, fix start point
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [0, 30, 0], endPos: [30, 30, 0] })).result
  const pts2 = (await api.v1.sketch.getPoints({ id: l2 })).result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [pts2.startId] })
  await api.v1.sketch.constraint({ id: skId, type: 'HORIZONTAL', geomIds: [l2] })

  const posBefore = {
    l2Start: (await api.v1.sketch.getPositions({ id: pts2.startId })).result,
    l2End: (await api.v1.sketch.getPositions({ id: pts2.endId })).result,
  }
  const lenBefore = Math.abs(posBefore.l2End.pos.x - posBefore.l2Start.pos.x)
  console.log('[07b] lenBefore:', lenBefore)

  await snapshot('before')

  // Now add EQUAL_LENGTH — l2 should extend to match l1
  const cr = await api.v1.sketch.constraint({ id: skId, type: 'EQUAL_LENGTH', geomIds: [l1, l2] })
  console.log('[07b] constraint result:', cr.result, 'maxLevel:', cr.maxLevel)

  const posAfter = {
    l2Start: (await api.v1.sketch.getPositions({ id: pts2.startId })).result,
    l2End: (await api.v1.sketch.getPositions({ id: pts2.endId })).result,
  }
  const lenAfter = Math.abs(posAfter.l2End.pos.x - posAfter.l2Start.pos.x)
  console.log('[07b] lenAfter:', lenAfter)

  await snapshot('after')

  filewrite({ lenBefore, lenAfter, constraintResult: cr.result, maxLevel: cr.maxLevel, equal: Math.abs(lenAfter - 60) < 0.01 }, 'equal-length-constrained-data')

  return { partId }
}
