// Test: ANGLE dimension between two lines
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'DimTest' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Two lines sharing a point, at ~45°
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [60, 0, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [40, 40, 0] })).result

  // Fix l1
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [l1] })

  // Connect starts
  const pts1 = (await api.v1.sketch.getPoints({ id: l1 })).result
  const pts2 = (await api.v1.sketch.getPoints({ id: l2 })).result
  await api.v1.sketch.constraint({ id: skId, type: 'COINCIDENT', geomIds: [pts1.startId, pts2.startId] })

  const l2EndBefore = (await api.v1.sketch.getPositions({ id: pts2.endId })).result
  console.log('[07] l2 end before:', JSON.stringify(l2EndBefore))

  await snapshot('before')

  // ANGLE dimension with value='60deg' — docs show deg suffix
  const dimR = await api.v1.sketch.dimension({
    id: skId, type: 'ANGLE', geomIds: [l1, l2],
    dimPos: [20, 15, 0], value: '60deg'
  })
  console.log('[07] ANGLE: result:', dimR.result, 'maxLevel:', dimR.maxLevel)

  const l2EndAfter = (await api.v1.sketch.getPositions({ id: pts2.endId })).result
  console.log('[07] l2 end after:', JSON.stringify(l2EndAfter))

  const dimNode = dimR.structure ? Object.values(dimR.structure.tree).find(n => n.id === dimR.result) : null
  console.log('[07] dim class:', dimNode?.class, 'name:', dimNode?.name)

  filewrite({
    dimId: dimR.result,
    maxLevel: dimR.maxLevel,
    dimClass: dimNode?.class,
    dimName: dimNode?.name,
    l2EndBefore,
    l2EndAfter,
    dimMembers: dimNode?.members
  }, 'angle-data')

  await snapshot('after')

  return { partId }
}
