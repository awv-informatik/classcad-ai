export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'VerticalEdge' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result

  await api.v1.common.recalc({})

  // Find vertical front-left edge (x=0, y=0, midpoint z=20)
  const geoIds = (await api.v1.part.getGeometryIds({
    id: partId,
    lines: [
      { pos: [0, 0, 20] },    // front-left vertical
      { pos: [80, 0, 20] },   // front-right vertical
    ],
  })).result
  console.log('[13] vertical edge IDs:', JSON.stringify(geoIds.lines))

  // Chamfer both vertical edges
  const r = await api.v1.part.chamfer({
    id: partId,
    name: 'VertChamfer',
    references: geoIds.lines,
    distance1: 15,
  })
  console.log('[13] chamfer result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) console.log('[13] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'chamfer-response')

  await snapshot('result')

  return { partId, chamferId: r.result }
}
