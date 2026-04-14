// Test updateDimension on all 7 dimension types
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'AllTypes' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Create geometry: rectangle + circle + diagonal line
  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result
  const circId = (await api.v1.sketch.circle({ id: skId, centerPos: [150, 30, 0], radius: 20 })).result
  // Diagonal line for ANGLE/ANGLEOX
  const diagId = (await api.v1.sketch.line({ id: skId, startPos: [200, 0, 0], endPos: [250, 40, 0] })).result

  // Fix bottom-left of rectangle and circle center
  const rectPts = (await api.v1.sketch.getPoints({ id: rectIds[0] })).result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [rectPts.startId] })
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [circId] })
  // Fix diagonal line start
  const diagPts = (await api.v1.sketch.getPoints({ id: diagId })).result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [diagPts.startId] })

  const results = {}

  // 1. OFFSET on bottom line
  const d1 = (await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [rectIds[0]] })).result
  const u1 = await api.v1.sketch.updateDimension({ id: d1, value: 100 })
  const p1 = (await api.v1.sketch.getPositions({ id: rectIds[0] })).result
  results.OFFSET = { result: u1.result, maxLevel: u1.maxLevel, endX: p1.endPos.x }
  console.log('[04] OFFSET:', u1.result, u1.maxLevel, 'endX:', p1.endPos.x)

  // 2. HORIZONTAL_DISTANCE on bottom line
  // Need a new line for this
  const hLine = (await api.v1.sketch.line({ id: skId, startPos: [0, -30, 0], endPos: [60, -30, 0] })).result
  const hPts = (await api.v1.sketch.getPoints({ id: hLine })).result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [hPts.startId] })
  const d2 = (await api.v1.sketch.dimension({ id: skId, type: 'HORIZONTAL_DISTANCE', geomIds: [hLine] })).result
  const u2 = await api.v1.sketch.updateDimension({ id: d2, value: 90 })
  const p2 = (await api.v1.sketch.getPositions({ id: hLine })).result
  results.HORIZONTAL_DISTANCE = { result: u2.result, maxLevel: u2.maxLevel, endX: p2.endPos.x }
  console.log('[04] H_DIST:', u2.result, u2.maxLevel, 'endX:', p2.endPos.x)

  // 3. VERTICAL_DISTANCE on left line (rectIds[3])
  const d3 = (await api.v1.sketch.dimension({ id: skId, type: 'VERTICAL_DISTANCE', geomIds: [rectIds[3]] })).result
  const u3 = await api.v1.sketch.updateDimension({ id: d3, value: 70 })
  const p3 = (await api.v1.sketch.getPositions({ id: rectIds[3] })).result
  results.VERTICAL_DISTANCE = { result: u3.result, maxLevel: u3.maxLevel, endY: p3.endPos.y }
  console.log('[04] V_DIST:', u3.result, u3.maxLevel, 'endY:', p3.endPos.y)

  // 4. RADIUS on circle
  const d4 = (await api.v1.sketch.dimension({ id: skId, type: 'RADIUS', geomIds: [circId] })).result
  const u4 = await api.v1.sketch.updateDimension({ id: d4, value: 35 })
  // Check circle radius via structure
  results.RADIUS = { result: u4.result, maxLevel: u4.maxLevel }
  console.log('[04] RADIUS:', u4.result, u4.maxLevel)

  // 5. DIAMETER on circle — but circle already has RADIUS dim, this may over-constrain
  // Create a new circle for DIAMETER
  const circ2Id = (await api.v1.sketch.circle({ id: skId, centerPos: [150, -40, 0], radius: 15 })).result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [circ2Id] })
  const d5 = (await api.v1.sketch.dimension({ id: skId, type: 'DIAMETER', geomIds: [circ2Id] })).result
  const u5 = await api.v1.sketch.updateDimension({ id: d5, value: 50 }) // diameter=50 -> radius=25
  results.DIAMETER = { result: u5.result, maxLevel: u5.maxLevel }
  console.log('[04] DIAMETER:', u5.result, u5.maxLevel)

  // 6. ANGLE between bottom line and diagonal
  // Need two non-parallel lines. Use rectIds[0] and diagId
  const d6 = (await api.v1.sketch.dimension({ id: skId, type: 'ANGLE', geomIds: [rectIds[0], diagId], dimPos: [220, 20, 0] })).result
  console.log('[04] ANGLE dim created:', d6)
  if (d6 != null) {
    const u6 = await api.v1.sketch.updateDimension({ id: d6, value: '30deg' })
    const p6 = (await api.v1.sketch.getPositions({ id: diagId })).result
    results.ANGLE = { result: u6.result, maxLevel: u6.maxLevel, diagEnd: p6.endPos }
    console.log('[04] ANGLE:', u6.result, u6.maxLevel, 'diagEnd:', JSON.stringify(p6.endPos))
  }

  // 7. ANGLEOX on diagonal
  // diagId may already have ANGLE constraint — use a new line
  const aoxLine = (await api.v1.sketch.line({ id: skId, startPos: [200, -50, 0], endPos: [240, -20, 0] })).result
  const aoxPts = (await api.v1.sketch.getPoints({ id: aoxLine })).result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [aoxPts.startId] })
  const d7 = (await api.v1.sketch.dimension({ id: skId, type: 'ANGLEOX', geomIds: [aoxLine] })).result
  console.log('[04] ANGLEOX dim created:', d7)
  if (d7 != null) {
    const u7 = await api.v1.sketch.updateDimension({ id: d7, value: '60deg' })
    const p7 = (await api.v1.sketch.getPositions({ id: aoxLine })).result
    results.ANGLEOX = { result: u7.result, maxLevel: u7.maxLevel, end: p7.endPos }
    console.log('[04] ANGLEOX:', u7.result, u7.maxLevel, 'end:', JSON.stringify(p7.endPos))
  }

  await snapshot('all-types')

  filewrite(results, 'all-types-data')
  return { partId }
}
