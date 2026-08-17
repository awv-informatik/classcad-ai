export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'OversizedUpdateTest' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result

  await api.v1.common.recalc({})
  const edges = (await api.v1.part.getGeometryIds({ id: partId, lines: [{ pos: [40, 0, 40] }] })).result
  const edgeId = edges.lines[0]

  // Create valid fillet
  const filletId = (await api.v1.part.fillet({
    id: partId,
    name: 'Fillet1',
    references: [edgeId],
    radius: 10,
  })).result
  console.log('[04] valid filletId:', filletId)

  await snapshot('valid-fillet')

  // Update to oversized radius
  await api.v1.part.openFeature({ id: filletId })
  const r = await api.v1.part.updateFillet({ id: filletId, radius: 50 })
  console.log('[04] oversized update — result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'oversized-update')
  await api.v1.part.closeFeature({ id: filletId })

  await snapshot('after-oversized')
  return { filletId }
}
