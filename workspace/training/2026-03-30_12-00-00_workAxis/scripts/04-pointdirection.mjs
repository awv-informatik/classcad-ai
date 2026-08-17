// Test: POINTDIRECTION type — point + direction refs from brep geometry
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Build a box: 80x60x40
  await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })

  // Get brep IDs: vertex at origin + vertical edge
  const gids = await api.v1.part.getGeometryIds({
    id: partId,
    points: [
      { pos: [0, 0, 0] },        // corner vertex
      { pos: [80, 60, 40] },     // opposite corner
    ],
    lines: [
      { pos: [40, 0, 0] },       // bottom-front edge midpoint
      { pos: [0, 0, 20] },       // left-front vertical edge midpoint
    ]
  })
  console.log('[04] geoIds:', JSON.stringify(gids.result))
  filewrite(gids.result, 'geometry-ids')

  const pt1 = gids.result?.points?.[0]
  const pt2 = gids.result?.points?.[1]
  const edge1 = gids.result?.lines?.[0]
  const edge2 = gids.result?.lines?.[1]
  console.log('[04] pt1:', pt1, 'pt2:', pt2, 'edge1:', edge1, 'edge2:', edge2)

  // POINTDIRECTION: point(vertex) + direction(edge)
  if (pt1 && edge1) {
    const r1 = await api.v1.part.workAxis({
      id: partId,
      name: 'WA_ptdir',
      type: 'POINTDIRECTION',
      references: [pt1, edge1]
    })
    console.log('[04] POINTDIRECTION result:', r1.result, 'maxLevel:', r1.maxLevel)
    console.log('[04] messages:', JSON.stringify(r1.messages))
    filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'ptdir-response')
  } else {
    console.log('[04] SKIP POINTDIRECTION — missing refs')
  }

  // Also try with work point + work axis as refs
  const wpId = (await api.v1.part.workPoint({
    id: partId, name: 'WP_origin', position: [50, 30, 20]
  })).result
  console.log('[04] workPoint:', wpId)

  const waRef = (await api.v1.part.workAxis({
    id: partId, name: 'WA_ref', direction: [0, 1, 0]
  })).result
  console.log('[04] workAxis ref:', waRef)

  if (wpId && waRef) {
    const r2 = await api.v1.part.workAxis({
      id: partId,
      name: 'WA_ptdir_work',
      type: 'POINTDIRECTION',
      references: [wpId, waRef]
    })
    console.log('[04] POINTDIRECTION(work) result:', r2.result, 'maxLevel:', r2.maxLevel)
    console.log('[04] messages:', JSON.stringify(r2.messages))
    filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'ptdir-work-response')
  }

  await snapshot('pointdirection')
  return { partId }
}
