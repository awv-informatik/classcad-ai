// Test: HORIZONTAL_DISTANCE and VERTICAL_DISTANCE between two points (not lines)
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'DimTest' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Two lines, use their endpoints as points
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [40, 30, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [60, 10, 0], endPos: [90, 50, 0] })).result

  const pts1 = (await api.v1.sketch.getPoints({ id: l1 })).result
  const pts2 = (await api.v1.sketch.getPoints({ id: l2 })).result

  // Fix l1 start
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [pts1.startId] })

  // H_DIST between l1.start and l2.start with value=80
  const hdR = await api.v1.sketch.dimension({
    id: skId, type: 'HORIZONTAL_DISTANCE', geomIds: [pts1.startId, pts2.startId], value: 80
  })
  console.log('[15] H_DIST pts: result:', hdR.result, 'maxLevel:', hdR.maxLevel)

  // V_DIST between l1.start and l1.end with value=20
  const vdR = await api.v1.sketch.dimension({
    id: skId, type: 'VERTICAL_DISTANCE', geomIds: [pts1.startId, pts1.endId], value: 20
  })
  console.log('[15] V_DIST pts: result:', vdR.result, 'maxLevel:', vdR.maxLevel)

  const l1End = (await api.v1.sketch.getPositions({ id: pts1.endId })).result
  const l2Start = (await api.v1.sketch.getPositions({ id: pts2.startId })).result
  console.log('[15] l1.end after:', JSON.stringify(l1End), 'l2.start after:', JSON.stringify(l2Start))

  filewrite({
    hdist: { id: hdR.result, maxLevel: hdR.maxLevel, messages: hdR.messages },
    vdist: { id: vdR.result, maxLevel: vdR.maxLevel, messages: vdR.messages },
    l1EndAfter: l1End,
    l2StartAfter: l2Start
  }, 'hdist-vdist-points')

  await snapshot('result')
  return { partId }
}
