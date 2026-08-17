export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UpdateFilletTest' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result

  await api.v1.common.recalc({})
  const edges = (await api.v1.part.getGeometryIds({ id: partId, lines: [{ pos: [40, 0, 40] }] })).result
  const edgeId = edges.lines[0]
  console.log('[01] edgeId:', edgeId)

  // Create fillet with radius=5
  const r1 = await api.v1.part.fillet({
    id: partId,
    name: 'Fillet1',
    references: [edgeId],
    radius: 5,
  })
  const filletId = r1.result
  console.log('[01] fillet created — id:', filletId, 'maxLevel:', r1.maxLevel)

  await snapshot('before-update')

  // Update radius to 15
  await api.v1.part.openFeature({ id: filletId })
  const r2 = await api.v1.part.updateFillet({ id: filletId, radius: 15 })
  console.log('[01] update result:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages?.length) console.log('[01] messages:', JSON.stringify(r2.messages))
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'update-response')
  await api.v1.part.closeFeature({ id: filletId })

  await snapshot('after-update')

  return { partId, filletId }
}
