export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Dist2EqualTest' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})

  const edges = (await api.v1.part.getGeometryIds({ id: partId, lines: [{ pos: [40, 0, 40] }] })).result
  const edgeId = edges.lines[0]

  // Create EQUAL_DISTANCE chamfer
  const chamferId = (await api.v1.part.chamfer({
    id: partId,
    references: [edgeId],
    type: 'EQUAL_DISTANCE',
    distance1: 10,
  })).result
  console.log('[05] chamferId:', chamferId)
  await snapshot('initial')

  // Try updating with distance2 while staying EQUAL_DISTANCE
  await api.v1.part.openFeature({ id: chamferId })
  const r1 = await api.v1.part.updateChamfer({ id: chamferId, distance2: 20 })
  console.log('[05] set distance2=20 on EQUAL_DISTANCE — result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'dist2-on-equal')
  await api.v1.part.closeFeature({ id: chamferId })
  await snapshot('after-dist2')

  // Try updating with angle while staying EQUAL_DISTANCE
  await api.v1.part.openFeature({ id: chamferId })
  const r2 = await api.v1.part.updateChamfer({ id: chamferId, angle: 'C:PI/6' })
  console.log('[05] set angle on EQUAL_DISTANCE — result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'angle-on-equal')
  await api.v1.part.closeFeature({ id: chamferId })
  await snapshot('after-angle')

  return { chamferId }
}
