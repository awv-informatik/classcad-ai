// Test HORIZONTAL and VERTICAL on lines and point-pairs
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Angled line — should become horizontal after constraint
  const l1 = (await api.v1.sketch.line({
    id: skId, startPos: [0, 0, 0], endPos: [60, 20, 0],
    genFixation: false, genVertAndHoriz: false,
  })).result

  const l1PtsBefore = await getLinePositions(api, l1)
  console.log('[03] l1 BEFORE horizontal:', l1PtsBefore)

  const rH = await api.v1.sketch.constraint({ id: skId, type: 'HORIZONTAL', geomIds: [l1] })
  console.log('[03] HORIZONTAL on line result:', rH.result, 'maxLevel:', rH.maxLevel)

  const l1PtsAfter = await getLinePositions(api, l1)
  console.log('[03] l1 AFTER horizontal:', l1PtsAfter)

  // Another angled line — should become vertical
  const l2 = (await api.v1.sketch.line({
    id: skId, startPos: [80, 0, 0], endPos: [100, 40, 0],
    genFixation: false, genVertAndHoriz: false,
  })).result

  const l2PtsBefore = await getLinePositions(api, l2)
  const rV = await api.v1.sketch.constraint({ id: skId, type: 'VERTICAL', geomIds: [l2] })
  const l2PtsAfter = await getLinePositions(api, l2)
  console.log('[03] l2 BEFORE vertical:', l2PtsBefore)
  console.log('[03] l2 AFTER vertical:', l2PtsAfter)
  console.log('[03] VERTICAL on line result:', rV.result, 'maxLevel:', rV.maxLevel)

  // HORIZONTAL on two points (not a line)
  const pt1 = (await api.v1.sketch.point({ id: skId, pos: [0, 50, 0], genFixation: false })).result
  const pt2 = (await api.v1.sketch.point({ id: skId, pos: [40, 70, 0], genFixation: false })).result

  const pt1PosBefore = (await api.v1.sketch.getPositions({ id: pt1 })).result
  const pt2PosBefore = (await api.v1.sketch.getPositions({ id: pt2 })).result

  const rHPts = await api.v1.sketch.constraint({
    id: skId, type: 'HORIZONTAL', geomIds: [pt1, pt2],
  })
  console.log('[03] HORIZONTAL on 2 points result:', rHPts.result, 'maxLevel:', rHPts.maxLevel)

  const pt1PosAfter = (await api.v1.sketch.getPositions({ id: pt1 })).result
  const pt2PosAfter = (await api.v1.sketch.getPositions({ id: pt2 })).result
  console.log('[03] pt1 before:', pt1PosBefore, 'after:', pt1PosAfter)
  console.log('[03] pt2 before:', pt2PosBefore, 'after:', pt2PosAfter)

  // VERTICAL on two points
  const pt3 = (await api.v1.sketch.point({ id: skId, pos: [60, 50, 0], genFixation: false })).result
  const pt4 = (await api.v1.sketch.point({ id: skId, pos: [80, 70, 0], genFixation: false })).result

  const rVPts = await api.v1.sketch.constraint({
    id: skId, type: 'VERTICAL', geomIds: [pt3, pt4],
  })
  console.log('[03] VERTICAL on 2 points result:', rVPts.result, 'maxLevel:', rVPts.maxLevel)

  const pt3PosAfter = (await api.v1.sketch.getPositions({ id: pt3 })).result
  const pt4PosAfter = (await api.v1.sketch.getPositions({ id: pt4 })).result
  console.log('[03] pt3 after:', pt3PosAfter, '| pt4 after:', pt4PosAfter)

  filewrite({
    horizontalLine: { before: l1PtsBefore, after: l1PtsAfter, result: rH.result },
    verticalLine: { before: l2PtsBefore, after: l2PtsAfter, result: rV.result },
    horizontalPts: {
      before: { pt1: pt1PosBefore, pt2: pt2PosBefore },
      after: { pt1: pt1PosAfter, pt2: pt2PosAfter },
      result: rHPts.result,
    },
    verticalPts: {
      after: { pt3: pt3PosAfter, pt4: pt4PosAfter },
      result: rVPts.result,
    },
  }, 'horiz-vert-data')

  await snapshot('result')
  return { partId }
}

async function getLinePositions(api, lineId) {
  const pts = (await api.v1.sketch.getPoints({ id: lineId })).result
  const startPos = (await api.v1.sketch.getPositions({ id: pts.startId })).result
  const endPos = (await api.v1.sketch.getPositions({ id: pts.endId })).result
  return { start: startPos, end: endPos }
}
