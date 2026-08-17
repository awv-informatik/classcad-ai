export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NoOpenTest' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result

  await api.v1.common.recalc({})
  const edges = (await api.v1.part.getGeometryIds({ id: partId, lines: [{ pos: [40, 0, 40] }] })).result
  const edgeId = edges.lines[0]

  const filletId = (await api.v1.part.fillet({
    id: partId,
    name: 'Fillet1',
    references: [edgeId],
    radius: 5,
  })).result
  console.log('[02] filletId:', filletId)

  // Try updateFillet WITHOUT openFeature
  const r = await api.v1.part.updateFillet({ id: filletId, radius: 15 })
  console.log('[02] no-open result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'no-open-response')

  await snapshot('after-no-open')
  return { filletId }
}
