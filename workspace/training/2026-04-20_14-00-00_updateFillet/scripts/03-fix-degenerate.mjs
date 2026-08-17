export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FixDegenerateTest' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result

  await api.v1.common.recalc({})
  const edges = (await api.v1.part.getGeometryIds({ id: partId, lines: [{ pos: [40, 0, 40] }] })).result
  const edgeId = edges.lines[0]
  console.log('[03] edgeId:', edgeId)

  // Create oversized fillet (radius=50 > height 40)
  const r1 = await api.v1.part.fillet({
    id: partId,
    name: 'BigFillet',
    references: [edgeId],
    radius: 50,
  })
  const filletId = r1.result
  console.log('[03] oversized fillet — id:', filletId, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'oversized-response')

  await snapshot('degenerate')

  // Fix via updateFillet
  await api.v1.part.openFeature({ id: filletId })
  const r2 = await api.v1.part.updateFillet({ id: filletId, radius: 10 })
  console.log('[03] fix result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'fix-response')
  await api.v1.part.closeFeature({ id: filletId })

  await snapshot('fixed')
  return { filletId }
}
