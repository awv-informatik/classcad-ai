// 10 — getPositions on circle ID vs center ID, and cross-method consistency
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'PosTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const circleId = (await api.v1.sketch.circle({ id: skId, centerPos: [30, 20, 0], radius: 15 })).result
  const pts = await api.v1.sketch.getPoints({ id: circleId })
  console.log('[10] getPoints(circleId):', JSON.stringify(pts.result))

  // getPositions on circle directly — docs say it should return { centerPos }
  const posCircle = await api.v1.sketch.getPositions({ id: circleId })
  console.log('[10] getPositions(circleId):', JSON.stringify(posCircle.result), 'maxLevel:', posCircle.maxLevel)
  if (posCircle.messages?.length) console.log('[10] messages:', JSON.stringify(posCircle.messages))

  // getPositions on center point
  const posCenter = await api.v1.sketch.getPositions({ id: pts.result.centerId })
  console.log('[10] getPositions(centerId):', JSON.stringify(posCenter.result))

  return { partId }
}
