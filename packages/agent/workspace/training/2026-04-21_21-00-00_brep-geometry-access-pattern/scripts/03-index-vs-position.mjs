export default async function (api, { snapshot, filewrite }) {
  // Compare: index-based (getBrepGeometryByIndex on latest feature) vs position-based (getGeometryIds)
  const partId = (await api.v1.part.create({ name: 'IndexVsPos' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})

  // Fillet 2 vertical edges
  const edges = (await api.v1.part.getGeometryIds({
    id: partId,
    lines: [
      { pos: [0, 0, 20] },   // front-left vertical
      { pos: [80, 0, 20] },  // front-right vertical
    ],
  })).result.lines
  const filletId = (await api.v1.part.fillet({
    id: partId,
    references: edges,
    radius: 8,
  })).result
  await api.v1.common.recalc({})

  // Method A: Index-based enumeration on the FILLET feature (latest)
  const indexLines = []
  for (let i = 0; ; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: filletId, lineIndex: i })
    if (r.result === null) break
    indexLines.push(r.result)
  }
  const indexArcs = []
  for (let i = 0; ; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: filletId, arcIndex: i })
    if (r.result === null) break
    indexArcs.push(r.result)
  }
  console.log('[03] fillet feature: lines:', indexLines.length, 'arcs:', indexArcs.length)

  // Method B: Position-based lookup for the same edges
  // Find bottom edges (not filleted — still straight)
  const posLines = (await api.v1.part.getGeometryIds({
    id: partId,
    lines: [
      { pos: [40, 0, 0] },   // bottom-front
      { pos: [40, 60, 0] },  // bottom-back
      { pos: [80, 30, 0] },  // bottom-right
      { pos: [0, 30, 0] },   // bottom-left
    ],
  })).result.lines
  console.log('[03] position-based bottom edges:', posLines)

  // Are the position-found IDs a subset of the index-enumerated IDs?
  const idSet = new Set(indexLines.map(String))
  const posFoundInIndex = posLines.map(id => idSet.has(String(id)))
  console.log('[03] position IDs found in fillet feature index?', posFoundInIndex)

  // Test: can we use index-enumerated IDs from the fillet feature for chamfer?
  // Pick one edge by index that we know isn't filleted
  const testEdge = indexLines[0] // first line in the fillet feature's brep
  const testPos = await api.v1.part.getGeometryPositions({ elems: [testEdge] })
  console.log('[03] indexLines[0] id:', testEdge, 'position:', JSON.stringify(testPos.result?.[0]?.positions))

  const chamferId = (await api.v1.part.chamfer({
    id: partId,
    references: [testEdge],
    distance1: 5,
  })).result
  console.log('[03] chamfer using index-enumerated edge:', chamferId != null ? '✓' : '❌', 'id:', chamferId)

  await snapshot('index-vs-position')

  filewrite({
    indexLines,
    indexArcs,
    posLines,
    posFoundInIndex,
    testEdgeId: testEdge,
    testEdgePosition: testPos.result?.[0]?.positions,
    chamferId,
  }, 'comparison')

  return { partId }
}
