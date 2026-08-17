// Test EQUAL_LENGTH and EQUAL_RADIUS constraints
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Two lines of different lengths — EQUAL_LENGTH should equalize
  const l1 = (await api.v1.sketch.line({
    id: skId, startPos: [0, 0, 0], endPos: [60, 0, 0],
    genFixation: false, genVertAndHoriz: false,
  })).result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [l1] })

  const l2 = (await api.v1.sketch.line({
    id: skId, startPos: [0, 30, 0], endPos: [30, 30, 0],
    genFixation: false, genVertAndHoriz: false,
  })).result

  const l2Before = await getLinePositions(api, l2)
  console.log('[06] l2 BEFORE equal_length:', l2Before)

  const rEL = await api.v1.sketch.constraint({ id: skId, type: 'EQUAL_LENGTH', geomIds: [l1, l2] })
  console.log('[06] EQUAL_LENGTH result:', rEL.result, 'maxLevel:', rEL.maxLevel)

  const l2After = await getLinePositions(api, l2)
  console.log('[06] l2 AFTER equal_length:', l2After)

  // Check: which line's length won? Measure both
  const l1Len = lineLength(await getLinePositions(api, l1))
  const l2Len = lineLength(l2After)
  console.log('[06] l1 length:', l1Len, '| l2 length:', l2Len)

  filewrite({
    equalLength: {
      l2Before, l2After,
      l1Length: l1Len, l2Length: l2Len,
      result: rEL.result,
    },
  }, 'equal-length')

  // EQUAL_RADIUS: two circles of different radii
  const partId2 = (await api.v1.part.create({ name: 'Test2' })).result
  const skId2 = (await api.v1.sketch.create({ id: partId2 })).result

  const c1 = (await api.v1.sketch.circle({
    id: skId2, centerPos: [0, 0, 0], radius: 30,
    genFixation: false,
  })).result
  await api.v1.sketch.constraint({ id: skId2, type: 'FIXATION', geomIds: [c1] })

  const c2 = (await api.v1.sketch.circle({
    id: skId2, centerPos: [80, 0, 0], radius: 15,
    genFixation: false,
  })).result

  const rER = await api.v1.sketch.constraint({ id: skId2, type: 'EQUAL_RADIUS', geomIds: [c1, c2] })
  console.log('[06] EQUAL_RADIUS result:', rER.result, 'maxLevel:', rER.maxLevel)

  // Check radius by measuring distance from center to a point on circle
  // Since getPositions returns null for circles, check structure
  filewrite({ equalRadius: { result: rER.result, maxLevel: rER.maxLevel } }, 'equal-radius')

  await snapshot('result')
  return { partId }
}

async function getLinePositions(api, lineId) {
  const pts = (await api.v1.sketch.getPoints({ id: lineId })).result
  const startPos = (await api.v1.sketch.getPositions({ id: pts.startId })).result
  const endPos = (await api.v1.sketch.getPositions({ id: pts.endId })).result
  return { start: startPos, end: endPos }
}

function lineLength(positions) {
  const dx = positions.end.pos.x - positions.start.pos.x
  const dy = positions.end.pos.y - positions.start.pos.y
  return Math.sqrt(dx * dx + dy * dy)
}
