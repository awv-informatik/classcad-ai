// Since getPositions fails on circle ID directly, check if circle's center point
// (from getPoints) works with getPositions as a workaround. Also try getPositions
// on a point that belongs to a circle's constraint system.
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create circle at specific coords
  const circId = (await api.v1.sketch.circle({ id: skId, centerPos: [50, 50, 0], radius: 25 })).result
  console.log('[15] circleId:', circId)

  // getPoints on circle → { centerId }
  const pts = (await api.v1.sketch.getPoints({ id: circId })).result
  console.log('[15] getPoints:', JSON.stringify(pts))

  if (pts && pts.centerId) {
    // getPositions on centerId — this should work
    const centerR = await api.v1.sketch.getPositions({ id: pts.centerId })
    console.log('[15] center pos:', JSON.stringify(centerR.result), 'maxLevel:', centerR.maxLevel)
    filewrite({ centerId: pts.centerId, centerPos: centerR.result, maxLevel: centerR.maxLevel }, 'circle-center-resolved')
  }

  return { partId }
}
