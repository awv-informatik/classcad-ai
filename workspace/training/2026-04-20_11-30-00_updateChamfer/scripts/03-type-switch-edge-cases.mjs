export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TypeSwitchTest' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})

  const edges = (await api.v1.part.getGeometryIds({ id: partId, lines: [{ pos: [40, 0, 40] }] })).result
  const edgeId = edges.lines[0]

  // Create as DISTANCE_ANGLE
  const chamferId = (await api.v1.part.chamfer({
    id: partId,
    references: [edgeId],
    type: 'DISTANCE_ANGLE',
    distance1: 15,
    angle: 'C:PI/6',
  })).result
  console.log('[03] chamferId:', chamferId)
  await snapshot('initial-dist-angle')

  // Switch to EQUAL_DISTANCE (no angle/distance2 needed)
  await api.v1.part.openFeature({ id: chamferId })
  const r1 = await api.v1.part.updateChamfer({ id: chamferId, type: 'EQUAL_DISTANCE', distance1: 10 })
  console.log('[03] → EQUAL_DISTANCE result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'to-equal-dist')
  await api.v1.part.closeFeature({ id: chamferId })
  await snapshot('after-equal-dist')

  // Switch to TWO_DISTANCES
  await api.v1.part.openFeature({ id: chamferId })
  const r2 = await api.v1.part.updateChamfer({ id: chamferId, type: 'TWO_DISTANCES', distance1: 5, distance2: 20 })
  console.log('[03] → TWO_DISTANCES result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'to-two-dist')
  await api.v1.part.closeFeature({ id: chamferId })
  await snapshot('after-two-dist')

  // Switch back to DISTANCE_ANGLE
  await api.v1.part.openFeature({ id: chamferId })
  const r3 = await api.v1.part.updateChamfer({ id: chamferId, type: 'DISTANCE_ANGLE', distance1: 15, angle: 'C:PI/3' })
  console.log('[03] → DISTANCE_ANGLE result:', r3.result, 'maxLevel:', r3.maxLevel)
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'to-dist-angle')
  await api.v1.part.closeFeature({ id: chamferId })
  await snapshot('after-dist-angle')

  return { chamferId }
}
