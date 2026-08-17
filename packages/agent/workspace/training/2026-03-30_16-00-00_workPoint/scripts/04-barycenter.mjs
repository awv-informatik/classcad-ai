// Test: BARYCENTER — work point at center of a face
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })

  const gids = await api.v1.part.getGeometryIds({
    id: partId,
    planes: [{ positions: [[40, 30, 40]] }]  // top face
  })
  const face = gids.result?.planes?.[0]
  console.log('[04] face:', face)

  if (face) {
    const r = await api.v1.part.workPoint({ id: partId, name: 'WP_bary', type: 'BARYCENTER', references: [face] })
    console.log('[04] BARYCENTER result:', r.result, 'maxLevel:', r.maxLevel)
    console.log('[04] messages:', JSON.stringify(r.messages))
    filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'barycenter')
  }

  // Also try with a work plane
  const topWp = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  if (topWp) {
    const r2 = await api.v1.part.workPoint({ id: partId, name: 'WP_bary_wp', type: 'BARYCENTER', references: [topWp] })
    console.log('[04] BARYCENTER(workPlane) result:', r2.result, 'maxLevel:', r2.maxLevel)
    console.log('[04] messages:', JSON.stringify(r2.messages))
    filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'barycenter-wp')
  }

  return { partId }
}
