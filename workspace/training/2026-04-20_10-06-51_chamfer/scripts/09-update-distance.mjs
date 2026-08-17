export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UpdateChamfer' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result

  await api.v1.common.recalc({})

  const edgeIds = (await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [40, 0, 40] }],
  })).result.lines

  // Create chamfer with small distance
  const chamferId = (await api.v1.part.chamfer({
    id: partId,
    name: 'Chamfer1',
    references: edgeIds,
    distance1: 5,
  })).result
  console.log('[09] initial chamferId:', chamferId)

  await snapshot('before-update')

  // Update: increase distance1 to 20
  await api.v1.part.openFeature({ id: chamferId })
  const rUp = await api.v1.part.updateChamfer({
    id: chamferId,
    distance1: 20,
  })
  await api.v1.part.closeFeature({ id: chamferId })
  console.log('[09] updateChamfer result:', rUp.result, 'maxLevel:', rUp.maxLevel)
  if (rUp.messages?.length) console.log('[09] messages:', JSON.stringify(rUp.messages))

  filewrite({ result: rUp.result, messages: rUp.messages, maxLevel: rUp.maxLevel }, 'update-response')

  await snapshot('after-update')

  return { partId, chamferId }
}
