export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UpdateRefs' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result

  await api.v1.common.recalc({})

  // Find front-left vertical edge
  const edge1 = (await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [0, 0, 20] }],
  })).result.lines
  console.log('[14] initial edge:', JSON.stringify(edge1))

  // Create chamfer on front-left vertical edge
  const chamferId = (await api.v1.part.chamfer({
    id: partId,
    name: 'Chamfer1',
    references: edge1,
    distance1: 15,
  })).result
  console.log('[14] chamferId:', chamferId)

  await snapshot('initial')

  // Now find top-front edge and update references to it
  // Need to recalc again after chamfer creation to get updated edge IDs
  await api.v1.common.recalc({})
  const edge2 = (await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [40, 0, 40] }],
  })).result.lines
  console.log('[14] new edge:', JSON.stringify(edge2))

  await api.v1.part.openFeature({ id: chamferId })
  const r = await api.v1.part.updateChamfer({
    id: chamferId,
    references: edge2,
  })
  await api.v1.part.closeFeature({ id: chamferId })
  console.log('[14] updateChamfer refs result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) console.log('[14] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'update-response')

  await snapshot('after-ref-change')

  return { partId, chamferId }
}
