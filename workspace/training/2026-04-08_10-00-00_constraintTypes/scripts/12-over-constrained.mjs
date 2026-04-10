// Test conflicting and over-constraining: HORIZONTAL + VERTICAL on same line
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // A diagonal line
  const l1 = (await api.v1.sketch.line({
    id: skId, startPos: [0, 0, 0], endPos: [50, 50, 0],
    genFixation: false, genVertAndHoriz: false,
  })).result

  // Make it horizontal
  const rH = await api.v1.sketch.constraint({ id: skId, type: 'HORIZONTAL', geomIds: [l1] })
  console.log('[12] HORIZONTAL result:', rH.result, 'maxLevel:', rH.maxLevel)

  // Now also vertical — this should conflict
  const rV = await api.v1.sketch.constraint({ id: skId, type: 'VERTICAL', geomIds: [l1] })
  console.log('[12] VERTICAL (conflict) result:', rV.result, 'maxLevel:', rV.maxLevel)
  if (rV.messages?.length) console.log('[12] messages:', JSON.stringify(rV.messages))

  // Redundant constraint — same horizontal twice
  const rH2 = await api.v1.sketch.constraint({ id: skId, type: 'HORIZONTAL', geomIds: [l1] })
  console.log('[12] 2nd HORIZONTAL result:', rH2.result, 'maxLevel:', rH2.maxLevel)

  // Does moveGeometry detect the conflict?
  const rMove = await api.v1.sketch.moveGeometry({
    id: skId, geomIds: [l1], translation: [10, 0, 0],
  })
  console.log('[12] moveGeometry on conflicted line:', rMove.result, 'maxLevel:', rMove.maxLevel)
  if (rMove.messages?.length) console.log('[12] move messages:', JSON.stringify(rMove.messages))

  const l1Pos = await getLinePositions(api, l1)
  console.log('[12] final position:', l1Pos)

  filewrite({
    horizontal: { result: rH.result, maxLevel: rH.maxLevel },
    vertical: { result: rV.result, maxLevel: rV.maxLevel, messages: rV.messages },
    redundant: { result: rH2.result, maxLevel: rH2.maxLevel },
    moveResult: { result: rMove.result, maxLevel: rMove.maxLevel, messages: rMove.messages },
    finalPos: l1Pos,
  }, 'over-constrained')

  return { partId }
}

async function getLinePositions(api, lineId) {
  const pts = (await api.v1.sketch.getPoints({ id: lineId })).result
  const startPos = (await api.v1.sketch.getPositions({ id: pts.startId })).result
  const endPos = (await api.v1.sketch.getPositions({ id: pts.endId })).result
  return { start: startPos, end: endPos }
}
