// Test: ANGLE with reflex=TRUE — should measure the outer (>180°) angle
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'DimTest' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Two lines at ~60°
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [60, 0, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [30, 52, 0] })).result

  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [l1] })
  const pts1 = (await api.v1.sketch.getPoints({ id: l1 })).result
  const pts2 = (await api.v1.sketch.getPoints({ id: l2 })).result
  await api.v1.sketch.constraint({ id: skId, type: 'COINCIDENT', geomIds: [pts1.startId, pts2.startId] })

  // Normal ANGLE dimension (no reflex)
  const dim1R = await api.v1.sketch.dimension({
    id: skId, type: 'ANGLE', geomIds: [l1, l2],
    dimPos: [20, 10, 0], value: '60deg', reflex: false
  })
  console.log('[12] normal ANGLE: result:', dim1R.result, 'maxLevel:', dim1R.maxLevel)

  const l2EndNormal = (await api.v1.sketch.getPositions({ id: pts2.endId })).result
  console.log('[12] l2 end (normal 60deg):', JSON.stringify(l2EndNormal))

  await snapshot('normal-angle')

  // Now remove and try with reflex — need to delete old dim first
  await api.v1.sketch.deleteObject({ id: skId, ids: [dim1R.result] })

  // Reflex ANGLE with value=300deg (360-60=300)
  const dim2R = await api.v1.sketch.dimension({
    id: skId, type: 'ANGLE', geomIds: [l1, l2],
    dimPos: [20, -10, 0], value: '300deg', reflex: true
  })
  console.log('[12] reflex ANGLE: result:', dim2R.result, 'maxLevel:', dim2R.maxLevel)

  const l2EndReflex = (await api.v1.sketch.getPositions({ id: pts2.endId })).result
  console.log('[12] l2 end (reflex 300deg):', JSON.stringify(l2EndReflex))

  const dimNode = dim2R.structure ? Object.values(dim2R.structure.tree).find(n => n.id === dim2R.result) : null

  filewrite({
    normalAngle: { id: dim1R.result, maxLevel: dim1R.maxLevel, l2End: l2EndNormal },
    reflexAngle: { id: dim2R.result, maxLevel: dim2R.maxLevel, l2End: l2EndReflex, dimMembers: dimNode?.members }
  }, 'reflex-data')

  await snapshot('reflex-angle')

  return { partId }
}
