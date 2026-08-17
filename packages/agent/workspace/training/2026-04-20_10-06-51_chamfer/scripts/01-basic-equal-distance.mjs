export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ChamferTest' })).result

  // Create a box: 80x60x40
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result
  console.log('[01] boxId:', boxId)

  await snapshot('before')

  // Find a top-front edge (at z=40, y=0, midpoint x=40)
  const geoIds = (await api.v1.part.getGeometryIds({ id: partId, lines: [{ pos: [40, 0, 40] }] })).result
  console.log('[01] edge IDs:', JSON.stringify(geoIds.lines))

  // Create chamfer with default EQUAL_DISTANCE, distance1=5
  const r = await api.v1.part.chamfer({
    id: partId,
    name: 'Chamfer1',
    references: geoIds.lines,
    distance1: 5,
  })
  console.log('[01] chamfer result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) console.log('[01] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'chamfer-response')

  await snapshot('after')

  return { partId, boxId, chamferId: r.result }
}
