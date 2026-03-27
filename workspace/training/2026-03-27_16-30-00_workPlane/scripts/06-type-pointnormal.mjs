// 06 — Type POINTNORMAL: point + direction (edge/axis as normal)
// Also tests POINTFACE: point + face (face normal defines plane normal)
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create box for references
  await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })

  // Get edges (lines) and vertices
  const gids = await api.v1.part.getGeometryIds({ id: partId })
  const lines = gids.result?.lines || []
  const verts = gids.result?.points || []
  const planes = gids.result?.planes || []
  console.log('[06] lines:', lines.length, 'verts:', verts.length, 'planes:', planes.length)

  // A) POINTNORMAL: vertex + edge (edge direction = plane normal)
  if (verts.length > 0 && lines.length > 0) {
    const wp1 = await api.v1.part.workPlane({
      id: partId, name: 'WP_ptNormal',
      type: 'POINTNORMAL',
      references: [verts[0], lines[0]]
    })
    console.log('[06] POINTNORMAL vert+edge:', wp1.result, 'maxLevel:', wp1.maxLevel)
    if (wp1.messages?.length) console.log('[06] msgs:', JSON.stringify(wp1.messages))
  }

  // B) POINTNORMAL: vertex + work axis
  const wa = (await api.v1.part.workAxis({ id: partId, name: 'AX_Z', direction: [0, 0, 1] })).result
  if (verts.length > 0) {
    const wp2 = await api.v1.part.workPlane({
      id: partId, name: 'WP_ptAxis',
      type: 'POINTNORMAL',
      references: [verts[0], wa]
    })
    console.log('[06] POINTNORMAL vert+axis:', wp2.result, 'maxLevel:', wp2.maxLevel)
  }

  // C) POINTFACE: vertex + face (face normal → plane normal)
  if (verts.length > 0 && planes.length > 0) {
    const wp3 = await api.v1.part.workPlane({
      id: partId, name: 'WP_ptFace',
      type: 'POINTFACE',
      references: [verts[2], planes[0]]
    })
    console.log('[06] POINTFACE vert+face:', wp3.result, 'maxLevel:', wp3.maxLevel)
    if (wp3.messages?.length) console.log('[06] msgs:', JSON.stringify(wp3.messages))
  }

  await snapshot('type-pointnormal-pointface')
  return { partId }
}
