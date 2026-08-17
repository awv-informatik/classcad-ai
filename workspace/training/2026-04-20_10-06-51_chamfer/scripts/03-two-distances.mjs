export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ChamferTwoDist' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result
  console.log('[03] partId:', partId, 'boxId:', boxId)

  // Find top-front edge — log full result
  const geoR = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [40, 0, 40] }],
  })
  console.log('[03] getGeometryIds maxLevel:', geoR.maxLevel)
  filewrite({ result: geoR.result, messages: geoR.messages, maxLevel: geoR.maxLevel }, 'geo-ids')

  const edgeIds = geoR.result.lines
  console.log('[03] edge IDs:', JSON.stringify(edgeIds))

  // First confirm we can do EQUAL_DISTANCE on this edge
  const rEq = await api.v1.part.chamfer({
    id: partId,
    name: 'ChamferEq',
    references: edgeIds,
    distance1: 10,
  })
  console.log('[03] EQUAL_DISTANCE result:', rEq.result, 'maxLevel:', rEq.maxLevel)
  if (rEq.messages?.length) console.log('[03] EQUAL_DISTANCE messages:', JSON.stringify(rEq.messages))

  await snapshot('equal-dist')

  return { partId, boxId, chamferId: rEq.result }
}
