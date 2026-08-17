export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NoOpenTest' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})

  const edges = (await api.v1.part.getGeometryIds({ id: partId, lines: [{ pos: [40, 0, 40] }] })).result
  const edgeId = edges.lines[0]
  console.log('[01] edgeId:', edgeId)

  const chamferId = (await api.v1.part.chamfer({
    id: partId,
    references: [edgeId],
    distance1: 10,
  })).result
  console.log('[01] chamferId:', chamferId)

  // Try updateChamfer WITHOUT openFeature
  const r = await api.v1.part.updateChamfer({ id: chamferId, distance1: 20 })
  console.log('[01] updateChamfer without open — result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'no-open-response')

  await snapshot('after-no-open')
  return { chamferId }
}
