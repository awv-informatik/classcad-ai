// 04 — Type PLANE: reference a brep-face or work-plane, with offset
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create a box: length=80(X), width=60(Y), height=40(Z) at origin
  await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })

  // Get face IDs by known positions (getGeometryIds is position-based lookup)
  // Top face: z=40, center at [40,30,40]
  const gids = await api.v1.part.getGeometryIds({
    id: partId,
    planes: [
      { positions: [[40, 30, 40]] },   // top face (z=40)
      { positions: [[40, 30, 0]] },     // bottom face (z=0)
      { positions: [[40, 0, 20]] },     // front face (y=0)
    ],
    points: [
      { pos: [0, 0, 0] },              // corner vertex
      { pos: [80, 60, 40] },           // opposite corner
    ],
    lines: [
      { pos: [40, 0, 0] },             // bottom-front edge midpoint
    ]
  })
  const topFace = gids.result?.planes?.[0]
  const botFace = gids.result?.planes?.[1]
  const frontFace = gids.result?.planes?.[2]
  const cornerVert = gids.result?.points?.[0]
  const oppVert = gids.result?.points?.[1]
  const frontEdge = gids.result?.lines?.[0]
  console.log('[04] topFace:', topFace, 'botFace:', botFace, 'frontFace:', frontFace)
  console.log('[04] cornerVert:', cornerVert, 'oppVert:', oppVert, 'frontEdge:', frontEdge)

  // A) PLANE referencing a brep face — top face
  if (topFace) {
    const wp1 = await api.v1.part.workPlane({ id: partId, name: 'WP_topFace', type: 'PLANE', references: [topFace] })
    console.log('[04] PLANE ref topFace:', wp1.result, 'maxLevel:', wp1.maxLevel)
    if (wp1.messages?.length) console.log('[04] msgs:', JSON.stringify(wp1.messages))
  }

  // B) PLANE referencing a brep face + offset
  if (botFace) {
    const wp2 = await api.v1.part.workPlane({ id: partId, name: 'WP_botFace_off20', type: 'PLANE', references: [botFace], offset: 20 })
    console.log('[04] PLANE ref botFace+off20:', wp2.result, 'maxLevel:', wp2.maxLevel)
  }

  // C) PLANE referencing a work-plane (built-in Top) + offset
  const topWp = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const wp3 = await api.v1.part.workPlane({ id: partId, name: 'WP_refTop_off50', type: 'PLANE', references: [topWp], offset: 50 })
  console.log('[04] PLANE ref Top+off50:', wp3.result, 'maxLevel:', wp3.maxLevel)

  await snapshot('type-plane')
  return { partId }
}
