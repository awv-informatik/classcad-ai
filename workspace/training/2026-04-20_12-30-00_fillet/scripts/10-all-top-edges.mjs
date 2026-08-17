export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FilletAllTop' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result

  await api.v1.common.recalc({})
  await snapshot('before')

  // Find all 4 top edges (z=40)
  const geoIds = (await api.v1.part.getGeometryIds({
    id: partId,
    lines: [
      { pos: [40, 0, 40] },   // top-front
      { pos: [80, 30, 40] },  // top-right
      { pos: [40, 60, 40] },  // top-back
      { pos: [0, 30, 40] },   // top-left
    ],
  })).result
  console.log('[10] edge IDs:', JSON.stringify(geoIds.lines))
  console.log('[10] edge count:', geoIds.lines.length)

  const r = await api.v1.part.fillet({
    id: partId,
    name: 'TopFillet',
    references: geoIds.lines,
    radius: 12,
  })
  console.log('[10] fillet result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'all-top-response')

  await snapshot('after')

  return { partId, filletId: r.result }
}
