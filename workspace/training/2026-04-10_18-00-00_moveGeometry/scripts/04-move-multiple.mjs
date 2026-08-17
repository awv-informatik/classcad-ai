// 04 — Move multiple geometry items at once
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [40, 0, 0] })).result
  const circId = (await api.v1.sketch.circle({ id: skId, centerPos: [60, 30, 0], radius: 10 })).result
  const ptId = (await api.v1.sketch.point({ id: skId, pos: [80, 50, 0] })).result
  console.log('[04] lineId:', lineId, 'circId:', circId, 'ptId:', ptId)

  await snapshot('before')

  // Move all three at once
  const r = await api.v1.sketch.moveGeometry({
    id: skId,
    geomIds: [lineId, circId, ptId],
    translation: [10, 20, 0],
  })
  console.log('[04] moveGeometry result:', r.result, 'maxLevel:', r.maxLevel)

  // Check positions after
  const lineAfter = (await api.v1.sketch.getPositions({ id: lineId })).result
  const ptAfter = (await api.v1.sketch.getPositions({ id: ptId })).result
  const circPts = (await api.v1.sketch.getPoints({ id: circId })).result
  const circCenterAfter = (await api.v1.sketch.getPositions({ id: circPts.centerId })).result

  console.log('[04] line after:', JSON.stringify(lineAfter))
  console.log('[04] circle center after:', JSON.stringify(circCenterAfter))
  console.log('[04] point after:', JSON.stringify(ptAfter))

  filewrite({
    moveResult: r.result,
    maxLevel: r.maxLevel,
    lineAfter,
    circCenterAfter,
    ptAfter,
  }, 'move-multiple-result')

  await snapshot('after')

  return { partId }
}
