// 06 — Types POINTNORMAL and POINTFACE
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create box for references
  await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })

  // Get brep refs by known positions
  const gids = await api.v1.part.getGeometryIds({
    id: partId,
    points: [
      { pos: [0, 0, 40] },     // top-left-front corner
      { pos: [80, 60, 40] },   // top-right-back corner
    ],
    lines: [
      { pos: [40, 0, 40] },    // top-front edge midpoint (along X)
      { pos: [0, 0, 20] },     // left-front vertical edge midpoint (along Z)
    ],
    planes: [
      { positions: [[40, 30, 40]] },  // top face
    ]
  })
  const v0 = gids.result?.points?.[0]
  const v1 = gids.result?.points?.[1]
  const edgeX = gids.result?.lines?.[0]
  const edgeZ = gids.result?.lines?.[1]
  const topFace = gids.result?.planes?.[0]
  console.log('[06] v0:', v0, 'v1:', v1, 'edgeX:', edgeX, 'edgeZ:', edgeZ, 'topFace:', topFace)

  // A) POINTNORMAL: vertex + brep edge (edge direction = plane normal)
  if (v0 && edgeZ) {
    const wp1 = await api.v1.part.workPlane({
      id: partId, name: 'WP_ptNormal_edge',
      type: 'POINTNORMAL', references: [v0, edgeZ]
    })
    console.log('[06] POINTNORMAL vert+edge:', wp1.result, 'maxLevel:', wp1.maxLevel)
    if (wp1.messages?.length) console.log('[06] msgs:', JSON.stringify(wp1.messages))
  }

  // B) POINTNORMAL: work point + work axis
  const wpt = (await api.v1.part.workPoint({ id: partId, name: 'Pt_mid', position: [40, 30, 20] })).result
  const wax = (await api.v1.part.workAxis({ id: partId, name: 'AX_diag', direction: [1, 1, 0] })).result
  const wp2 = await api.v1.part.workPlane({
    id: partId, name: 'WP_ptNormal_axis',
    type: 'POINTNORMAL', references: [wpt, wax]
  })
  console.log('[06] POINTNORMAL wpt+axis:', wp2.result, 'maxLevel:', wp2.maxLevel)

  // C) POINTFACE: vertex + brep face (face normal → plane normal, vertex → position)
  if (v1 && topFace) {
    const wp3 = await api.v1.part.workPlane({
      id: partId, name: 'WP_ptFace',
      type: 'POINTFACE', references: [v1, topFace]
    })
    console.log('[06] POINTFACE vert+face:', wp3.result, 'maxLevel:', wp3.maxLevel)
    if (wp3.messages?.length) console.log('[06] msgs:', JSON.stringify(wp3.messages))
  }

  // D) POINTFACE: work point + work plane
  if (wpt) {
    const frontWp = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Front' })).result
    const wp4 = await api.v1.part.workPlane({
      id: partId, name: 'WP_ptFace_wp',
      type: 'POINTFACE', references: [wpt, frontWp]
    })
    console.log('[06] POINTFACE wpt+workplane:', wp4.result, 'maxLevel:', wp4.maxLevel)
  }

  await snapshot('type-pointnormal-pointface')
  return { partId }
}
