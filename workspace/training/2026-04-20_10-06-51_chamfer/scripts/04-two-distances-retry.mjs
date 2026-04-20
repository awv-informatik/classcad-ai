export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ChamferTwoDist2' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result
  console.log('[04] partId:', partId, 'boxId:', boxId)

  // Find top-front edge
  const edgeIds = (await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [40, 0, 40] }],
  })).result.lines
  console.log('[04] edge IDs:', JSON.stringify(edgeIds))

  await snapshot('before')

  // TWO_DISTANCES: distance1=5, distance2=20
  const r = await api.v1.part.chamfer({
    id: partId,
    name: 'ChamferAsym',
    references: edgeIds,
    type: 'TWO_DISTANCES',
    distance1: 5,
    distance2: 20,
  })
  console.log('[04] TWO_DISTANCES result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) console.log('[04] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'chamfer-response')

  await snapshot('after')

  return { partId, chamferId: r.result }
}
