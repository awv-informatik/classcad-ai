export default async function (api, { snapshot, filewrite }) {
  // After fillet: what edges exist? How do we find remaining unfilleted edges AND fillet arcs?
  const partId = (await api.v1.part.create({ name: 'PostFillet' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})

  // Fillet one edge (top-front)
  const preEdge = (await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [40, 0, 40] }],
  })).result.lines[0]
  const filletId = (await api.v1.part.fillet({
    id: partId,
    references: [preEdge],
    radius: 8,
  })).result
  await api.v1.common.recalc({})
  console.log('[02] filletId:', filletId, 'boxId:', boxId)

  // Enumerate ALL edges of the fillet feature using getBrepGeometryByIndex
  const filletLines = []
  for (let i = 0; ; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: filletId, lineIndex: i })
    if (r.result === null) break
    filletLines.push({ index: i, id: r.result })
  }
  const filletArcs = []
  for (let i = 0; ; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: filletId, arcIndex: i })
    if (r.result === null) break
    filletArcs.push({ index: i, id: r.result })
  }
  const filletFaces = []
  for (let i = 0; ; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: filletId, faceIndex: i })
    if (r.result === null) break
    filletFaces.push({ index: i, id: r.result })
  }
  console.log('[02] fillet feature: lines:', filletLines.length, 'arcs:', filletArcs.length, 'faces:', filletFaces.length)

  // Now find unfilleted edges by position — the top-right, top-back, top-left edges
  const remainingEdges = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [
      { pos: [80, 30, 40] },  // top-right edge midpoint
      { pos: [40, 60, 40] },  // top-back edge midpoint
      { pos: [0, 30, 40] },   // top-left edge midpoint
      { pos: [40, 0, 0] },    // bottom-front edge midpoint
    ],
  })
  console.log('[02] remaining edges:', JSON.stringify(remainingEdges.result.lines))
  console.log('[02] remaining maxLevel:', remainingEdges.maxLevel)

  // Can the fillet arc IDs be used as references for a subsequent chamfer?
  // First try: chamfer on a remaining straight edge
  const chamferId = (await api.v1.part.chamfer({
    id: partId,
    references: [remainingEdges.result.lines[0]], // top-right edge
    distance1: 5,
  })).result
  console.log('[02] chamfer on unfilleted edge:', chamferId, '✓')

  await snapshot('fillet-then-chamfer')

  // Get positions for fillet arc edges (to understand arc topology)
  const arcPositions = await api.v1.part.getGeometryPositions({ elems: filletArcs.map(a => a.id) })

  filewrite({
    filletFeature: { lines: filletLines, arcs: filletArcs, faces: filletFaces },
    remainingEdges: remainingEdges.result,
    chamferId,
    arcPositions: arcPositions.result,
  }, 'post-fillet-topology')

  return { partId }
}
