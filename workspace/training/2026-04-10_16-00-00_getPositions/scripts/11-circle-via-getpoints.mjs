// Circle fails with getPositions directly — try via getPoints → getPositions on centerId
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const circId = (await api.v1.sketch.circle({ id: skId, centerPos: [30, 30, 0], radius: 20 })).result
  console.log('[11] circleId:', circId)

  // Direct getPositions fails — confirmed in script 03
  const directR = await api.v1.sketch.getPositions({ id: circId })
  console.log('[11] direct getPositions maxLevel:', directR.maxLevel, 'result:', directR.result)

  // Try via getPoints
  const pts = (await api.v1.sketch.getPoints({ id: circId })).result
  console.log('[11] getPoints result:', JSON.stringify(pts))

  if (pts && pts.centerId) {
    const centerPos = (await api.v1.sketch.getPositions({ id: pts.centerId })).result
    console.log('[11] via centerId getPositions:', JSON.stringify(centerPos))
    filewrite({ circId, directFails: true, viaGetPoints: centerPos }, 'circle-workaround')
  } else {
    console.log('[11] getPoints also failed or has no centerId')
    filewrite({ circId, directFails: true, getPointsResult: pts }, 'circle-workaround')
  }

  return { partId }
}
