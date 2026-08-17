export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UpdateType' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result

  await api.v1.common.recalc({})

  const edgeIds = (await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [40, 0, 40] }],
  })).result.lines

  // Create EQUAL_DISTANCE chamfer
  const chamferId = (await api.v1.part.chamfer({
    id: partId,
    name: 'Chamfer1',
    references: edgeIds,
    distance1: 10,
  })).result
  console.log('[10] initial chamferId:', chamferId)

  await snapshot('equal-dist')

  // Update to TWO_DISTANCES
  await api.v1.part.openFeature({ id: chamferId })
  const r1 = await api.v1.part.updateChamfer({
    id: chamferId,
    type: 'TWO_DISTANCES',
    distance1: 5,
    distance2: 20,
  })
  await api.v1.part.closeFeature({ id: chamferId })
  console.log('[10] update to TWO_DISTANCES:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) console.log('[10] messages:', JSON.stringify(r1.messages))

  await snapshot('two-dist')

  // Update to DISTANCE_ANGLE
  await api.v1.part.openFeature({ id: chamferId })
  const r2 = await api.v1.part.updateChamfer({
    id: chamferId,
    type: 'DISTANCE_ANGLE',
    distance1: 15,
    angle: 'C:PI/3',
  })
  await api.v1.part.closeFeature({ id: chamferId })
  console.log('[10] update to DISTANCE_ANGLE:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages?.length) console.log('[10] messages:', JSON.stringify(r2.messages))

  await snapshot('dist-angle')

  filewrite({
    twoDist: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    distAngle: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
  }, 'update-results')

  return { partId, chamferId }
}
