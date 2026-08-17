export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FilletMulti' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result

  await api.v1.common.recalc({})
  await snapshot('before')

  // Find 3 edges: top-front, top-right, bottom-front
  const geoIds = (await api.v1.part.getGeometryIds({
    id: partId,
    lines: [
      { pos: [40, 0, 40] },   // top-front
      { pos: [80, 30, 40] },  // top-right
      { pos: [40, 0, 0] },    // bottom-front
    ],
  })).result
  console.log('[03] edge IDs:', JSON.stringify(geoIds.lines))
  console.log('[03] edge count:', geoIds.lines.length)

  const r = await api.v1.part.fillet({
    id: partId,
    name: 'MultiFillet',
    references: geoIds.lines,
    radius: 10,
  })
  console.log('[03] fillet result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'fillet-response')

  await snapshot('after')

  return { partId, filletId: r.result }
}
