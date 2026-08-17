// 05 — Type 3POINTS: reference three points (brep-vertex or work-point)
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create box for brep vertices
  await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })

  // Get vertices by known positions
  const gids = await api.v1.part.getGeometryIds({
    id: partId,
    points: [
      { pos: [0, 0, 0] },
      { pos: [80, 0, 0] },
      { pos: [0, 60, 0] },
    ]
  })
  const v0 = gids.result?.points?.[0]
  const v1 = gids.result?.points?.[1]
  const v2 = gids.result?.points?.[2]
  console.log('[05] verts:', v0, v1, v2)

  // A) 3POINTS with brep vertices (bottom-left triangle of box)
  if (v0 && v1 && v2) {
    const wp1 = await api.v1.part.workPlane({ id: partId, name: 'WP_3brepVerts', type: '3POINTS', references: [v0, v1, v2] })
    console.log('[05] 3POINTS brep verts:', wp1.result, 'maxLevel:', wp1.maxLevel)
    if (wp1.messages?.length) console.log('[05] msgs:', JSON.stringify(wp1.messages))
  }

  // B) 3POINTS with work points (angled plane)
  const wpt1 = (await api.v1.part.workPoint({ id: partId, name: 'P1', position: [0, 0, 0] })).result
  const wpt2 = (await api.v1.part.workPoint({ id: partId, name: 'P2', position: [100, 0, 0] })).result
  const wpt3 = (await api.v1.part.workPoint({ id: partId, name: 'P3', position: [50, 0, 80] })).result
  console.log('[05] work pts:', wpt1, wpt2, wpt3)

  const wp2 = await api.v1.part.workPlane({ id: partId, name: 'WP_3workPts', type: '3POINTS', references: [wpt1, wpt2, wpt3] })
  console.log('[05] 3POINTS work pts:', wp2.result, 'maxLevel:', wp2.maxLevel)
  if (wp2.messages?.length) console.log('[05] msgs:', JSON.stringify(wp2.messages))

  // C) 3POINTS with offset
  const wp3 = await api.v1.part.workPlane({ id: partId, name: 'WP_3pts_off', type: '3POINTS', references: [wpt1, wpt2, wpt3], offset: 25 })
  console.log('[05] 3POINTS+offset:', wp3.result, 'maxLevel:', wp3.maxLevel)

  await snapshot('type-3points')
  return { partId }
}
