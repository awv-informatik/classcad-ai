// 04 — 180-degree arc (semicircle): start and end are diametrically opposite
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ArcTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S1' })).result

  // Semicircle: start and end are 180 degrees apart
  // CW
  const r1 = await api.v1.curve.arcByCenter({
    id: shapeId,
    centerPos: [0, 0, 0],
    startPos: [20, 0, 0],
    endPos: [-20, 0, 0],
    isClockwise: true,
  })
  console.log('[04] CW semicircle:', r1.result, 'maxLevel:', r1.maxLevel)

  // CCW — offset for visibility
  const r2 = await api.v1.curve.arcByCenter({
    id: shapeId,
    centerPos: [60, 0, 0],
    startPos: [80, 0, 0],
    endPos: [40, 0, 0],
    isClockwise: false,
  })
  console.log('[04] CCW semicircle:', r2.result, 'maxLevel:', r2.maxLevel)

  await snapshot('semicircles')
  return { partId, shapeId }
}
