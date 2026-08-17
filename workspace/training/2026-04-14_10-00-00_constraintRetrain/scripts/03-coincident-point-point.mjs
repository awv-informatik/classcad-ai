// Test: COINCIDENT point-point — do points actually merge positions?
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'CoincidentTest' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Two separate lines with a gap
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [40, 0, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [50, 10, 0], endPos: [90, 10, 0] })).result

  const pts1 = (await api.v1.sketch.getPoints({ id: l1 })).result
  const pts2 = (await api.v1.sketch.getPoints({ id: l2 })).result

  const posBefore = {
    l1End: (await api.v1.sketch.getPositions({ id: pts1.endId })).result,
    l2Start: (await api.v1.sketch.getPositions({ id: pts2.startId })).result,
  }
  console.log('[03] before l1.end:', JSON.stringify(posBefore.l1End))
  console.log('[03] before l2.start:', JSON.stringify(posBefore.l2Start))

  await snapshot('before')

  // Constrain l1.end == l2.start
  const cr = await api.v1.sketch.constraint({ id: skId, type: 'COINCIDENT', geomIds: [pts1.endId, pts2.startId] })
  console.log('[03] constraint result:', cr.result, 'maxLevel:', cr.maxLevel)

  const posAfter = {
    l1End: (await api.v1.sketch.getPositions({ id: pts1.endId })).result,
    l2Start: (await api.v1.sketch.getPositions({ id: pts2.startId })).result,
  }
  console.log('[03] after l1.end:', JSON.stringify(posAfter.l1End))
  console.log('[03] after l2.start:', JSON.stringify(posAfter.l2Start))

  await snapshot('after')

  filewrite({
    before: posBefore,
    after: posAfter,
    constraintResult: cr.result,
    maxLevel: cr.maxLevel,
    coincident: posAfter.l1End.pos.x === posAfter.l2Start.pos.x && posAfter.l1End.pos.y === posAfter.l2Start.pos.y,
  }, 'coincident-pp-data')

  return { partId }
}
