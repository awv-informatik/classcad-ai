export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RenameTest' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result

  await api.v1.common.recalc({})
  const edges = (await api.v1.part.getGeometryIds({ id: partId, lines: [{ pos: [40, 0, 40] }] })).result

  const filletId = (await api.v1.part.fillet({
    id: partId,
    name: 'OriginalName',
    references: edges.lines,
    radius: 10,
  })).result
  console.log('[05] filletId:', filletId)

  await snapshot('before-rename')

  // Rename only — should not change geometry
  await api.v1.part.openFeature({ id: filletId })
  const r = await api.v1.part.updateFillet({ id: filletId, name: 'RenamedFillet' })
  console.log('[05] rename result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'rename-response')
  await api.v1.part.closeFeature({ id: filletId })

  await snapshot('after-rename')
  return { filletId }
}
