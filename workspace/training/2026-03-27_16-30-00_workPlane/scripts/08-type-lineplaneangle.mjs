// 08 — Type LINEPLANEANGLE: line + plane + angle
// "the line's midpoint defines the position and the plane the normal, angle rotates around line"
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })

  // Get brep refs
  const gids = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [
      { pos: [40, 0, 0] },    // bottom-front edge (along X)
    ],
    planes: [
      { positions: [[40, 30, 0]] },   // bottom face (z=0)
    ]
  })
  const edge = gids.result?.lines?.[0]
  const face = gids.result?.planes?.[0]
  console.log('[08] edge:', edge, 'face:', face)

  // A) LINEPLANEANGLE: brep edge + brep face, angle=0
  if (edge && face) {
    const wp1 = await api.v1.part.workPlane({
      id: partId, name: 'WP_lpa_0deg',
      type: 'LINEPLANEANGLE', references: [edge, face], angle: 0
    })
    console.log('[08] LPA angle=0:', wp1.result, 'maxLevel:', wp1.maxLevel)
  }

  // B) LINEPLANEANGLE: angle=45deg (in radians = PI/4)
  if (edge && face) {
    const wp2 = await api.v1.part.workPlane({
      id: partId, name: 'WP_lpa_45deg',
      type: 'LINEPLANEANGLE', references: [edge, face], angle: Math.PI / 4
    })
    console.log('[08] LPA angle=PI/4:', wp2.result, 'maxLevel:', wp2.maxLevel)
  }

  // C) LINEPLANEANGLE: angle=90deg
  if (edge && face) {
    const wp3 = await api.v1.part.workPlane({
      id: partId, name: 'WP_lpa_90deg',
      type: 'LINEPLANEANGLE', references: [edge, face], angle: Math.PI / 2
    })
    console.log('[08] LPA angle=PI/2:', wp3.result, 'maxLevel:', wp3.maxLevel)
  }

  // D) LINEPLANEANGLE with expression string (docs show '45deg')
  if (edge && face) {
    const wp4 = await api.v1.part.workPlane({
      id: partId, name: 'WP_lpa_expr',
      type: 'LINEPLANEANGLE', references: [edge, face], angle: '45deg'
    })
    console.log('[08] LPA angle="45deg":', wp4.result, 'maxLevel:', wp4.maxLevel)
    if (wp4.messages?.length) console.log('[08] msgs:', JSON.stringify(wp4.messages))
  }

  // E) LINEPLANEANGLE: work axis + work plane
  const wa = (await api.v1.part.workAxis({ id: partId, name: 'AX_X', position: [0, 30, 0], direction: [1, 0, 0] })).result
  const topWp = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const wp5 = await api.v1.part.workPlane({
    id: partId, name: 'WP_lpa_work',
    type: 'LINEPLANEANGLE', references: [wa, topWp], angle: '30deg'
  })
  console.log('[08] LPA workaxis+workplane:', wp5.result, 'maxLevel:', wp5.maxLevel)

  await snapshot('type-lineplaneangle')
  return { partId }
}
