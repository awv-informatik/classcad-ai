// Test: HORIZONTAL_DISTANCE dimension — between two points
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'DimTest' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Create two lines forming an L
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [60, 0, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [60, 0, 0], endPos: [60, 40, 0] })).result

  // Fix l1.start
  const pts1 = (await api.v1.sketch.getPoints({ id: l1 })).result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [pts1.startId] })
  await api.v1.sketch.constraint({ id: skId, type: 'HORIZONTAL', geomIds: [l1] })

  // Connect l1.end to l2.start
  const pts2 = (await api.v1.sketch.getPoints({ id: l2 })).result
  await api.v1.sketch.constraint({ id: skId, type: 'COINCIDENT', geomIds: [pts1.endId, pts2.startId] })

  await snapshot('before')

  // HORIZONTAL_DISTANCE on a single line — should measure horizontal extent
  const dim1R = await api.v1.sketch.dimension({ id: skId, type: 'HORIZONTAL_DISTANCE', geomIds: [l1] })
  console.log('[03] H_DIST on line: result:', dim1R.result, 'maxLevel:', dim1R.maxLevel)

  // HORIZONTAL_DISTANCE between two points
  const dim2R = await api.v1.sketch.dimension({ id: skId, type: 'HORIZONTAL_DISTANCE', geomIds: [pts1.startId, pts2.endId], value: 80 })
  console.log('[03] H_DIST 2pts: result:', dim2R.result, 'maxLevel:', dim2R.maxLevel)

  // Check if geometry changed
  const posAfter = {
    l1End: (await api.v1.sketch.getPositions({ id: pts1.endId })).result,
    l2End: (await api.v1.sketch.getPositions({ id: pts2.endId })).result
  }
  console.log('[03] after: l1End=', JSON.stringify(posAfter.l1End), 'l2End=', JSON.stringify(posAfter.l2End))

  // Get dim node info
  const dim1Node = dim1R.structure ? Object.values(dim1R.structure.tree).find(n => n.id === dim1R.result) : null
  const dim2Node = dim2R.structure ? Object.values(dim2R.structure.tree).find(n => n.id === dim2R.result) : null

  filewrite({
    dim1: { id: dim1R.result, maxLevel: dim1R.maxLevel, class: dim1Node?.class, name: dim1Node?.name },
    dim2: { id: dim2R.result, maxLevel: dim2R.maxLevel, class: dim2Node?.class, name: dim2Node?.name },
    posAfter
  }, 'hdist-data')

  await snapshot('after')

  return { partId }
}
