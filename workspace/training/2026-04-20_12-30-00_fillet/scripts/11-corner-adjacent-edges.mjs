export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FilletCorner' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result

  await api.v1.common.recalc({})
  await snapshot('before')

  // Find 3 edges that meet at the front-right-bottom corner (x=80, y=0, z=0)
  // These are: bottom-front (z=0,y=0), front-right vertical (y=0,x=80), bottom-right (z=0,x=80)
  const geoIds = (await api.v1.part.getGeometryIds({
    id: partId,
    lines: [
      { pos: [40, 0, 0] },    // bottom-front edge
      { pos: [80, 0, 20] },   // front-right vertical edge
      { pos: [80, 30, 0] },   // bottom-right edge
    ],
  })).result
  console.log('[11] edge IDs:', JSON.stringify(geoIds.lines))

  const r = await api.v1.part.fillet({
    id: partId,
    name: 'CornerFillet',
    references: geoIds.lines,
    radius: 15,
  })
  console.log('[11] fillet result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) console.log('[11] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'corner-response')

  await snapshot('after')

  return { partId, filletId: r.result }
}
