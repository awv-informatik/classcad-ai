export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FixDegenerateTest' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})

  const edges = (await api.v1.part.getGeometryIds({ id: partId, lines: [{ pos: [40, 0, 40] }] })).result
  const edgeId = edges.lines[0]
  console.log('[02] edgeId:', edgeId)

  // Create oversized chamfer (distance1=50 > height 40)
  const r1 = await api.v1.part.chamfer({
    id: partId,
    references: [edgeId],
    distance1: 50,
  })
  const chamferId = r1.result
  console.log('[02] oversized chamfer — result:', chamferId, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'oversized-response')

  await snapshot('degenerate')

  // Now try to fix it via updateChamfer with valid distance
  await api.v1.part.openFeature({ id: chamferId })
  const r2 = await api.v1.part.updateChamfer({ id: chamferId, distance1: 10 })
  console.log('[02] fix update — result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'fix-response')
  await api.v1.part.closeFeature({ id: chamferId })

  await snapshot('fixed')
  return { chamferId }
}
