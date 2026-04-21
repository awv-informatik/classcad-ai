export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FilletTest' })).result

  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result
  console.log('[01] boxId:', boxId)

  await snapshot('before')

  // Recalc first (chamfer training showed this is required for reliable edge IDs)
  await api.v1.common.recalc({})

  // Find top-front edge (z=40, y=0, midpoint x=40)
  const geoIds = (await api.v1.part.getGeometryIds({ id: partId, lines: [{ pos: [40, 0, 40] }] })).result
  console.log('[01] edge IDs:', JSON.stringify(geoIds.lines))

  // Create fillet with default radius (should be 2)
  const r = await api.v1.part.fillet({
    id: partId,
    name: 'Fillet1',
    references: geoIds.lines,
  })
  console.log('[01] fillet result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) console.log('[01] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'fillet-response')

  await snapshot('after')

  return { partId, boxId, filletId: r.result }
}
