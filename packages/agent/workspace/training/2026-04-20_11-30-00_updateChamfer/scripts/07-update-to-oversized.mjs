export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'OversizeUpdateTest' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})

  const edges = (await api.v1.part.getGeometryIds({ id: partId, lines: [{ pos: [40, 0, 40] }] })).result
  const edgeId = edges.lines[0]

  // Create valid chamfer
  const chamferId = (await api.v1.part.chamfer({
    id: partId,
    references: [edgeId],
    distance1: 10,
  })).result
  console.log('[07] chamferId:', chamferId, '(valid, d=10)')
  await snapshot('valid-chamfer')

  // Update to oversized distance
  await api.v1.part.openFeature({ id: chamferId })
  const r1 = await api.v1.part.updateChamfer({ id: chamferId, distance1: 50 })
  console.log('[07] update to d=50 — result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'oversized-update')
  await api.v1.part.closeFeature({ id: chamferId })
  await snapshot('after-oversized-update')

  return { chamferId }
}
