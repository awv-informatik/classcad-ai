// Test MIDPOINT constraint: point constrained to midpoint of a line
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Fixed line + free point
  const l1 = (await api.v1.sketch.line({
    id: skId, startPos: [0, 0, 0], endPos: [80, 0, 0],
    genFixation: false, genVertAndHoriz: false,
  })).result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [l1] })

  const pt = (await api.v1.sketch.point({ id: skId, pos: [20, 30, 0], genFixation: false })).result

  const ptBefore = (await api.v1.sketch.getPositions({ id: pt })).result
  console.log('[09] point BEFORE midpoint:', ptBefore)

  // MIDPOINT: [pointId, lineId]
  const rM = await api.v1.sketch.constraint({
    id: skId, type: 'MIDPOINT', geomIds: [pt, l1],
  })
  console.log('[09] MIDPOINT result:', rM.result, 'maxLevel:', rM.maxLevel)
  if (rM.messages?.length) console.log('[09] messages:', JSON.stringify(rM.messages))

  const ptAfter = (await api.v1.sketch.getPositions({ id: pt })).result
  console.log('[09] point AFTER midpoint:', ptAfter)
  // Expected: point should be at (40, 0, 0) — the midpoint of the line

  // What if we use a line endpoint instead of a free point?
  const l2 = (await api.v1.sketch.line({
    id: skId, startPos: [100, 20, 0], endPos: [100, 60, 0],
    genFixation: false, genVertAndHoriz: false,
  })).result
  const l2Pts = (await api.v1.sketch.getPoints({ id: l2 })).result

  const l2StartBefore = (await api.v1.sketch.getPositions({ id: l2Pts.startId })).result

  // MIDPOINT: l2's start point constrained to midpoint of l1
  const rM2 = await api.v1.sketch.constraint({
    id: skId, type: 'MIDPOINT', geomIds: [l2Pts.startId, l1],
  })
  console.log('[09] MIDPOINT line-endpoint result:', rM2.result, 'maxLevel:', rM2.maxLevel)

  const l2StartAfter = (await api.v1.sketch.getPositions({ id: l2Pts.startId })).result
  const l2EndAfter = (await api.v1.sketch.getPositions({ id: l2Pts.endId })).result
  console.log('[09] l2 start BEFORE:', l2StartBefore, 'AFTER:', l2StartAfter)
  console.log('[09] l2 end AFTER:', l2EndAfter)

  filewrite({
    freePoint: { before: ptBefore, after: ptAfter, result: rM.result },
    lineEndpoint: {
      startBefore: l2StartBefore, startAfter: l2StartAfter,
      endAfter: l2EndAfter,
      result: rM2.result,
    },
  }, 'midpoint-data')

  await snapshot('result')
  return { partId }
}
