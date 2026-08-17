// Test: CURVE type — references a single edge
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Build a box: 80x60x40
  await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })

  // Get edges from the box
  const gids = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [
      { pos: [40, 0, 0] },    // bottom-front edge midpoint
      { pos: [0, 0, 20] },    // left-front vertical edge
      { pos: [80, 30, 0] },   // bottom-right edge
    ]
  })
  console.log('[05] lines:', JSON.stringify(gids.result?.lines))
  filewrite(gids.result, 'geometry-ids')

  const edges = gids.result?.lines || []
  const validEdges = edges.filter(e => e != null && (typeof e === 'number' || typeof e === 'string'))
  console.log('[05] valid edges:', validEdges.length)

  if (validEdges.length > 0) {
    const r1 = await api.v1.part.workAxis({
      id: partId,
      name: 'WA_curve',
      type: 'CURVE',
      references: [validEdges[0]]
    })
    console.log('[05] CURVE result:', r1.result, 'maxLevel:', r1.maxLevel)
    console.log('[05] messages:', JSON.stringify(r1.messages))
    filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'curve-response')
  } else {
    console.log('[05] SKIP — no valid edges found')
  }

  // Also try CURVE with a work axis (axis referencing another axis)
  const waRef = (await api.v1.part.workAxis({
    id: partId, name: 'WA_ref', direction: [0, 0, 1]
  })).result

  if (waRef) {
    const r2 = await api.v1.part.workAxis({
      id: partId,
      name: 'WA_curve_from_wa',
      type: 'CURVE',
      references: [waRef]
    })
    console.log('[05] CURVE(workAxis) result:', r2.result, 'maxLevel:', r2.maxLevel)
    console.log('[05] messages:', JSON.stringify(r2.messages))
    filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'curve-workaxis-response')
  }

  await snapshot('curve-axis')
  return { partId }
}
