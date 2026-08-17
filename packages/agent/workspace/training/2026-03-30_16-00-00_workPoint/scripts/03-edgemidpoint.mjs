// Test: EDGEMIDPOINT — work point at midpoint of an edge
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })

  const gids = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [40, 0, 0] }, { pos: [0, 0, 20] }]
  })
  const edge1 = gids.result?.lines?.[0]
  const edge2 = gids.result?.lines?.[1]
  console.log('[03] edge1:', edge1, 'edge2:', edge2)

  if (edge1) {
    const r = await api.v1.part.workPoint({ id: partId, name: 'WP_mid', type: 'EDGEMIDPOINT', references: [edge1] })
    console.log('[03] EDGEMIDPOINT result:', r.result, 'maxLevel:', r.maxLevel)
    filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'edgemidpoint')
  }

  return { partId }
}
