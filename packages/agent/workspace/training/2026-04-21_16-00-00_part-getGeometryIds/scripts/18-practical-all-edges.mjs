export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'AllEdges' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})

  // Practical task: find ALL 12 edges of the box
  // Bottom 4 edges (Z=0)
  // Top 4 edges (Z=40)
  // 4 vertical edges
  const r = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [
      // Bottom 4
      { pos: [40, 0, 0] },   // front
      { pos: [80, 30, 0] },  // right
      { pos: [40, 60, 0] },  // back
      { pos: [0, 30, 0] },   // left
      // Top 4
      { pos: [40, 0, 40] },   // front
      { pos: [80, 30, 40] },  // right
      { pos: [40, 60, 40] },  // back
      { pos: [0, 30, 40] },   // left
      // Vertical 4
      { pos: [0, 0, 20] },     // front-left
      { pos: [80, 0, 20] },    // front-right
      { pos: [80, 60, 20] },   // back-right
      { pos: [0, 60, 20] },    // back-left
    ],
  })
  console.log('[18] all 12 edges:', JSON.stringify(r.result.lines))
  console.log('[18] unique count:', new Set(r.result.lines).size)
  console.log('[18] maxLevel:', r.maxLevel)

  // Verify all are unique
  const ids = r.result.lines
  const unique = [...new Set(ids)]
  console.log('[18] all unique?', ids.length === unique.length)

  // Now use getGeometryPositions to verify the round-trip
  const posR = await api.v1.part.getGeometryPositions({ elems: ids })
  for (const p of posR.result) {
    console.log(`[18]   edge ${p.id}: [${p.positions[0].x}, ${p.positions[0].y}, ${p.positions[0].z}]`)
  }

  filewrite({ edges: r.result, positions: posR.result }, 'all-edges')
  await snapshot('all-edges')
  return { partId }
}
