// Test: 2POINTS — work point at midpoint between 2 points
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })

  const gids = await api.v1.part.getGeometryIds({
    id: partId,
    points: [{ pos: [0, 0, 0] }, { pos: [80, 60, 40] }]
  })
  const pt1 = gids.result?.points?.[0]
  const pt2 = gids.result?.points?.[1]
  console.log('[06] pt1:', pt1, 'pt2:', pt2)

  if (pt1 && pt2) {
    const r = await api.v1.part.workPoint({ id: partId, name: 'WP_mid2', type: '2POINTS', references: [pt1, pt2] })
    console.log('[06] 2POINTS result:', r.result, 'maxLevel:', r.maxLevel)
    filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, '2points')
  }

  // Same point twice
  if (pt1) {
    const r2 = await api.v1.part.workPoint({ id: partId, name: 'WP_same', type: '2POINTS', references: [pt1, pt1] })
    console.log('[06] 2POINTS(same) result:', r2.result, 'maxLevel:', r2.maxLevel)
    console.log('[06] messages:', JSON.stringify(r2.messages))
    filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, '2points-same')
  }

  return { partId }
}
