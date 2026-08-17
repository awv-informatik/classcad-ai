export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Defaults' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result

  await api.v1.common.recalc({})

  const edgeIds = (await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [40, 0, 40] }],
  })).result.lines

  // Create chamfer with ALL defaults (no name, no type, no distance1)
  const r = await api.v1.part.chamfer({
    id: partId,
    references: edgeIds,
  })
  console.log('[15] defaults-only result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) console.log('[15] messages:', JSON.stringify(r.messages))

  // Check what defaults were used by examining the feature
  // Default name should be "Chamfer", default type EQUAL_DISTANCE, default distance1=2
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'defaults-response')

  await snapshot('defaults')

  // Update name
  const chamferId = r.result
  await api.v1.part.openFeature({ id: chamferId })
  const rName = await api.v1.part.updateChamfer({
    id: chamferId,
    name: 'RenamedChamfer',
  })
  await api.v1.part.closeFeature({ id: chamferId })
  console.log('[15] rename result:', rName.result, 'maxLevel:', rName.maxLevel)

  return { partId, chamferId }
}
