export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CommonConsumedTest' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 60, width: 40, height: 30 })).result

  // Create fillet to consume the box feature
  const geoIds = (await api.v1.part.getGeometryIds({ id: partId, lines: [{ pos: [60, 0, 15] }] })).result
  const filletId = (await api.v1.part.fillet({ id: partId, name: 'F1', references: geoIds.lines, radius: 5 })).result
  console.log('[18] boxId:', boxId, 'filletId:', filletId)

  // part.setAppearance on consumed box — should fail (we know this from script 15)
  const r1 = await api.v1.part.setAppearance({ target: boxId, color: [255, 0, 0] })
  console.log('[18] part.setAppearance on consumed box:', r1.maxLevel)
  if (r1.messages?.length) console.log('[18] part msgs:', JSON.stringify(r1.messages))

  // common.setAppearance on the SAME consumed box — does it also fail?
  const r2 = await api.v1.common.setAppearance({ target: boxId, color: [0, 255, 0] })
  console.log('[18] common.setAppearance on consumed box:', r2.maxLevel)
  if (r2.messages?.length) console.log('[18] common msgs:', JSON.stringify(r2.messages))

  // part.setAppearance on fillet (latest) — should work
  const r3 = await api.v1.part.setAppearance({ target: filletId, color: [0, 0, 255] })
  console.log('[18] part.setAppearance on fillet:', r3.maxLevel)

  // common.setAppearance on fillet — should also work
  const r4 = await api.v1.common.setAppearance({ target: filletId, color: [255, 255, 0] })
  console.log('[18] common.setAppearance on fillet:', r4.maxLevel)

  filewrite({
    partOnConsumed: { maxLevel: r1.maxLevel, msgs: r1.messages },
    commonOnConsumed: { maxLevel: r2.maxLevel, msgs: r2.messages },
    partOnFillet: { maxLevel: r3.maxLevel, msgs: r3.messages },
    commonOnFillet: { maxLevel: r4.maxLevel, msgs: r4.messages },
  }, 'common-consumed-results')

  return { partId }
}
