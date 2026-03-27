// 07 — Type EDGEPOINT: edge + point define the plane
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })

  // Get brep refs
  const gids = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [
      { pos: [40, 0, 0] },    // bottom-front edge (along X)
      { pos: [0, 30, 0] },    // bottom-left edge (along Y)
    ],
    points: [
      { pos: [0, 0, 40] },    // top-left-front vertex
      { pos: [80, 60, 0] },   // bottom-right-back vertex
    ]
  })
  const edgeX = gids.result?.lines?.[0]
  const edgeY = gids.result?.lines?.[1]
  const vTop = gids.result?.points?.[0]
  const vBack = gids.result?.points?.[1]
  console.log('[07] edgeX:', edgeX, 'edgeY:', edgeY, 'vTop:', vTop, 'vBack:', vBack)

  // A) EDGEPOINT: bottom-front edge + top vertex — defines angled plane
  if (edgeX && vTop) {
    const wp1 = await api.v1.part.workPlane({
      id: partId, name: 'WP_edgePt_1',
      type: 'EDGEPOINT', references: [edgeX, vTop]
    })
    console.log('[07] EDGEPOINT edge+vert:', wp1.result, 'maxLevel:', wp1.maxLevel)
    if (wp1.messages?.length) console.log('[07] msgs:', JSON.stringify(wp1.messages))
  }

  // B) EDGEPOINT: different edge + different vertex
  if (edgeY && vBack) {
    const wp2 = await api.v1.part.workPlane({
      id: partId, name: 'WP_edgePt_2',
      type: 'EDGEPOINT', references: [edgeY, vBack]
    })
    console.log('[07] EDGEPOINT edge2+vert2:', wp2.result, 'maxLevel:', wp2.maxLevel)
  }

  // C) EDGEPOINT with work axis + work point
  const wa = (await api.v1.part.workAxis({ id: partId, name: 'AX_Z', direction: [0, 0, 1] })).result
  const wpt = (await api.v1.part.workPoint({ id: partId, name: 'Pt_off', position: [50, 50, 0] })).result
  const wp3 = await api.v1.part.workPlane({
    id: partId, name: 'WP_edgePt_work',
    type: 'EDGEPOINT', references: [wa, wpt]
  })
  console.log('[07] EDGEPOINT axis+workpt:', wp3.result, 'maxLevel:', wp3.maxLevel)

  // D) EDGEPOINT with offset
  if (edgeX && vTop) {
    const wp4 = await api.v1.part.workPlane({
      id: partId, name: 'WP_edgePt_off',
      type: 'EDGEPOINT', references: [edgeX, vTop], offset: 30
    })
    console.log('[07] EDGEPOINT+offset:', wp4.result, 'maxLevel:', wp4.maxLevel)
  }

  await snapshot('type-edgepoint')
  return { partId }
}
