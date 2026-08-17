export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FilletOversized' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result

  await api.v1.common.recalc({})
  await snapshot('before')

  // Find bottom-front edge (y=0, z=0) — the smaller dimension edge
  const geoIds = (await api.v1.part.getGeometryIds({ id: partId, lines: [{ pos: [40, 0, 0] }] })).result
  console.log('[09] edge IDs:', JSON.stringify(geoIds.lines))

  // Test radius=50 on a box where height=40 — the fillet radius exceeds the adjacent face
  const r = await api.v1.part.fillet({
    id: partId,
    name: 'HugeFillet',
    references: geoIds.lines,
    radius: 50,
  })
  console.log('[09] radius=50 result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) console.log('[09] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'oversized-response')

  await snapshot('after-r50')

  return { partId, filletId: r.result }
}
