export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ConsumedTest' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 60, width: 40, height: 30 })).result

  // Color box before any downstream features
  const r1 = await api.v1.part.setAppearance({ target: boxId, color: [255, 0, 0] })
  console.log('[15] box before fillet:', r1.maxLevel)

  // Create fillet on box
  const geoIds = (await api.v1.part.getGeometryIds({ id: partId, lines: [{ pos: [60, 0, 15] }] })).result
  const filletId = (await api.v1.part.fillet({ id: partId, name: 'F1', references: geoIds.lines, radius: 5 })).result
  console.log('[15] filletId:', filletId)

  // Try to color box AFTER fillet was created (box consumed by fillet?)
  const r2 = await api.v1.part.setAppearance({ target: boxId, color: [0, 255, 0] })
  console.log('[15] box after fillet:', r2.maxLevel)
  if (r2.messages?.length) console.log('[15] box-after-fillet msgs:', JSON.stringify(r2.messages))

  // Color fillet (should work — it's the latest feature)
  const r3 = await api.v1.part.setAppearance({ target: filletId, color: [0, 0, 255] })
  console.log('[15] fillet (latest):', r3.maxLevel)
  if (r3.messages?.length) console.log('[15] fillet msgs:', JSON.stringify(r3.messages))

  // Now add a second fillet — does the first become consumed?
  const geoIds2 = (await api.v1.part.getGeometryIds({ id: partId, lines: [{ pos: [0, 40, 15] }] })).result
  const fillet2Id = (await api.v1.part.fillet({ id: partId, name: 'F2', references: geoIds2.lines, radius: 3 })).result
  console.log('[15] fillet2Id:', fillet2Id)

  // Try first fillet (now consumed by second fillet?)
  const r4 = await api.v1.part.setAppearance({ target: filletId, color: [255, 255, 0] })
  console.log('[15] fillet1 after fillet2:', r4.maxLevel)
  if (r4.messages?.length) console.log('[15] fillet1 consumed msgs:', JSON.stringify(r4.messages))

  // Second fillet (latest)
  const r5 = await api.v1.part.setAppearance({ target: fillet2Id, color: [255, 0, 255] })
  console.log('[15] fillet2 (latest):', r5.maxLevel)

  await snapshot('consumed-test')

  filewrite({
    boxBeforeFillet: { maxLevel: r1.maxLevel, msgs: r1.messages },
    boxAfterFillet: { maxLevel: r2.maxLevel, msgs: r2.messages },
    filletLatest: { maxLevel: r3.maxLevel, msgs: r3.messages },
    fillet1Consumed: { maxLevel: r4.maxLevel, msgs: r4.messages },
    fillet2Latest: { maxLevel: r5.maxLevel, msgs: r5.messages },
  }, 'consumed-results')

  return { partId }
}
