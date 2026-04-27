export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})

  // Get an edge ID
  const geoR = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [0, 0, 20] }],
  })
  const edgeId = geoR.result.lines[0]

  // Test with feature ID (boxId)
  const r1 = await api.v1.part.getBrepGeometryIndex({ id: boxId, geomId: edgeId })
  console.log('[04] with feature ID (boxId):', r1.result, 'maxLevel:', r1.maxLevel)

  // Test with part ID
  const r2 = await api.v1.part.getBrepGeometryIndex({ id: partId, geomId: edgeId })
  console.log('[04] with part ID:', r2.result, 'maxLevel:', r2.maxLevel)

  // Test with invalid geomId
  const r3 = await api.v1.part.getBrepGeometryIndex({ id: boxId, geomId: 99999 })
  console.log('[04] with invalid geomId:', r3.result, 'maxLevel:', r3.maxLevel)
  if (r3.messages) console.log('[04] messages:', JSON.stringify(r3.messages))

  // Test with part ID as geomId (wrong type)
  const r4 = await api.v1.part.getBrepGeometryIndex({ id: boxId, geomId: partId })
  console.log('[04] with partId as geomId:', r4.result, 'maxLevel:', r4.maxLevel)
  if (r4.messages) console.log('[04] messages:', JSON.stringify(r4.messages))

  filewrite({
    featureId: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    partId: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    invalidGeomId: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
    wrongTypeGeomId: { result: r4.result, maxLevel: r4.maxLevel, messages: r4.messages },
  }, 'id-type-tests')

  return { partId, boxId }
}
