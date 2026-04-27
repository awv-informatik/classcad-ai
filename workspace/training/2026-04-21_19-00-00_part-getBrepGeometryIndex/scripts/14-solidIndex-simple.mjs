export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})

  const geoR = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [0, 0, 20] }],
  })
  const edgeId = geoR.result.lines[0]

  // solidIndex=0 (default, box has exactly one solid)
  const r0 = await api.v1.part.getBrepGeometryIndex({ id: boxId, geomId: edgeId, solidIndex: 0 })
  console.log('[14] solidIndex=0:', r0.result, 'maxLevel:', r0.maxLevel)

  // solidIndex=1 (doesn't exist — box has only solid 0)
  const r1 = await api.v1.part.getBrepGeometryIndex({ id: boxId, geomId: edgeId, solidIndex: 1 })
  console.log('[14] solidIndex=1:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) console.log('[14] solidIndex=1 messages:', JSON.stringify(r1.messages.slice(0, 2)))

  // solidIndex omitted (should default to 0)
  const rDef = await api.v1.part.getBrepGeometryIndex({ id: boxId, geomId: edgeId })
  console.log('[14] no solidIndex:', rDef.result, 'maxLevel:', rDef.maxLevel)

  // solidIndex=-1 (invalid)
  const rNeg = await api.v1.part.getBrepGeometryIndex({ id: boxId, geomId: edgeId, solidIndex: -1 })
  console.log('[14] solidIndex=-1:', rNeg.result, 'maxLevel:', rNeg.maxLevel)

  console.log('[14] indices match:', r0.result === rDef.result)

  filewrite({
    solidIndex0: { result: r0.result, maxLevel: r0.maxLevel },
    solidIndex1: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    noSolidIndex: { result: rDef.result, maxLevel: rDef.maxLevel },
    solidIndexNeg1: { result: rNeg.result, maxLevel: rNeg.maxLevel, messages: rNeg.messages },
  }, 'solidindex-simple')

  return { partId }
}
