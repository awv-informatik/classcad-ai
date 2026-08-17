// Test: INTERSECTION — work point at intersection of 2 curves/edges
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })

  // Get two edges that meet at a corner
  const gids = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [
      { pos: [40, 0, 0] },   // bottom-front edge (along X)
      { pos: [0, 30, 0] },   // bottom-left edge (along Y)
    ]
  })
  const e1 = gids.result?.lines?.[0]
  const e2 = gids.result?.lines?.[1]
  console.log('[05] e1:', e1, 'e2:', e2)

  if (e1 && e2) {
    const r = await api.v1.part.workPoint({ id: partId, name: 'WP_inter', type: 'INTERSECTION', references: [e1, e2] })
    console.log('[05] INTERSECTION result:', r.result, 'maxLevel:', r.maxLevel)
    console.log('[05] messages:', JSON.stringify(r.messages))
    filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'intersection')
  }

  return { partId }
}
