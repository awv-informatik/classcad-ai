// Rerun of 07b: EQUAL_LENGTH with start fixed + HORIZONTAL — measure BOTH lines
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'EqLen2v' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Fixed line of length 60
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [60, 0, 0] })).result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [l1] })

  // Short HORIZONTAL line of length 30, fix start point
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [0, 30, 0], endPos: [30, 30, 0] })).result
  const pts2 = (await api.v1.sketch.getPoints({ id: l2 })).result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [pts2.startId] })
  await api.v1.sketch.constraint({ id: skId, type: 'HORIZONTAL', geomIds: [l2] })

  const pts1 = (await api.v1.sketch.getPoints({ id: l1 })).result

  const before = {
    l1Start: (await api.v1.sketch.getPositions({ id: pts1.startId })).result,
    l1End: (await api.v1.sketch.getPositions({ id: pts1.endId })).result,
    l2Start: (await api.v1.sketch.getPositions({ id: pts2.startId })).result,
    l2End: (await api.v1.sketch.getPositions({ id: pts2.endId })).result,
  }
  const l1LenBefore = Math.sqrt(Math.pow(before.l1End.pos.x - before.l1Start.pos.x, 2) + Math.pow(before.l1End.pos.y - before.l1Start.pos.y, 2))
  const l2LenBefore = Math.sqrt(Math.pow(before.l2End.pos.x - before.l2Start.pos.x, 2) + Math.pow(before.l2End.pos.y - before.l2Start.pos.y, 2))
  console.log('[07b2] BEFORE: l1 len:', l1LenBefore, 'l2 len:', l2LenBefore)
  console.log('[07b2]   l1:', JSON.stringify(before.l1Start.pos), '->', JSON.stringify(before.l1End.pos))
  console.log('[07b2]   l2:', JSON.stringify(before.l2Start.pos), '->', JSON.stringify(before.l2End.pos))

  // Apply EQUAL_LENGTH
  const cr = await api.v1.sketch.constraint({ id: skId, type: 'EQUAL_LENGTH', geomIds: [l1, l2] })
  console.log('[07b2] constraint result:', cr.result, 'maxLevel:', cr.maxLevel)
  if (cr.messages?.length) console.log('[07b2] messages:', JSON.stringify(cr.messages))

  const after = {
    l1Start: (await api.v1.sketch.getPositions({ id: pts1.startId })).result,
    l1End: (await api.v1.sketch.getPositions({ id: pts1.endId })).result,
    l2Start: (await api.v1.sketch.getPositions({ id: pts2.startId })).result,
    l2End: (await api.v1.sketch.getPositions({ id: pts2.endId })).result,
  }
  const l1LenAfter = Math.sqrt(Math.pow(after.l1End.pos.x - after.l1Start.pos.x, 2) + Math.pow(after.l1End.pos.y - after.l1Start.pos.y, 2))
  const l2LenAfter = Math.sqrt(Math.pow(after.l2End.pos.x - after.l2Start.pos.x, 2) + Math.pow(after.l2End.pos.y - after.l2Start.pos.y, 2))
  console.log('[07b2] AFTER: l1 len:', l1LenAfter, 'l2 len:', l2LenAfter)
  console.log('[07b2]   l1:', JSON.stringify(after.l1Start.pos), '->', JSON.stringify(after.l1End.pos))
  console.log('[07b2]   l2:', JSON.stringify(after.l2Start.pos), '->', JSON.stringify(after.l2End.pos))
  console.log('[07b2]   equal:', Math.abs(l1LenAfter - l2LenAfter) < 0.01)

  await snapshot('result')

  filewrite({
    before: { l1Len: l1LenBefore, l2Len: l2LenBefore, l1: { start: before.l1Start.pos, end: before.l1End.pos }, l2: { start: before.l2Start.pos, end: before.l2End.pos } },
    after: { l1Len: l1LenAfter, l2Len: l2LenAfter, l1: { start: after.l1Start.pos, end: after.l1End.pos }, l2: { start: after.l2Start.pos, end: after.l2End.pos } },
  }, 'equal-length-7b2')

  return { partId }
}
