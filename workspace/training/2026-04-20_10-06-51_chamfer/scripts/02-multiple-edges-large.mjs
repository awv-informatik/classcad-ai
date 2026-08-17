export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ChamferMulti' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result

  await snapshot('before')

  // Find 3 top edges: front (y=0,z=40), right (x=80,z=40), back (y=60,z=40)
  const geoIds = (await api.v1.part.getGeometryIds({
    id: partId,
    lines: [
      { pos: [40, 0, 40] },   // top-front
      { pos: [80, 30, 40] },  // top-right
      { pos: [40, 60, 40] },  // top-back
    ],
  })).result
  console.log('[02] edge IDs:', JSON.stringify(geoIds.lines))

  // Large chamfer (distance1=15) on all 3 edges
  const r = await api.v1.part.chamfer({
    id: partId,
    name: 'ChamferMulti',
    references: geoIds.lines,
    distance1: 15,
  })
  console.log('[02] chamfer result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) console.log('[02] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'chamfer-response')

  await snapshot('after')

  return { partId, chamferId: r.result }
}
