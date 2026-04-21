export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TypeNoParamsTest' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})

  const edges = (await api.v1.part.getGeometryIds({ id: partId, lines: [{ pos: [40, 0, 40] }] })).result
  const edgeId = edges.lines[0]

  // Create EQUAL_DISTANCE chamfer with d1=10
  const chamferId = (await api.v1.part.chamfer({
    id: partId,
    references: [edgeId],
    distance1: 10,
  })).result
  console.log('[08] chamferId:', chamferId)
  await snapshot('initial-equal-dist')

  // Switch to TWO_DISTANCES without providing distance2
  await api.v1.part.openFeature({ id: chamferId })
  const r1 = await api.v1.part.updateChamfer({ id: chamferId, type: 'TWO_DISTANCES' })
  console.log('[08] → TWO_DISTANCES (no d2) — result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'two-dist-no-d2')
  await api.v1.part.closeFeature({ id: chamferId })
  await snapshot('after-two-dist-no-d2')

  // Switch to DISTANCE_ANGLE without providing angle
  await api.v1.part.openFeature({ id: chamferId })
  const r2 = await api.v1.part.updateChamfer({ id: chamferId, type: 'DISTANCE_ANGLE' })
  console.log('[08] → DISTANCE_ANGLE (no angle) — result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'dist-angle-no-angle')
  await api.v1.part.closeFeature({ id: chamferId })
  await snapshot('after-dist-angle-no-angle')

  return { chamferId }
}
