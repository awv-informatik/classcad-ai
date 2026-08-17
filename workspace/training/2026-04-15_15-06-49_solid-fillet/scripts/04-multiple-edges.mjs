// 04 — Fillet multiple edges in one call
// Fillet all 4 top edges of a box (visible from isometric view)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MultiEdgeFillet' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result

  // Get all 12 edges
  const allEdges = []
  for (let i = 0; i < 12; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: eifId, lineIndex: i })
    if (r.result && r.maxLevel <= 31) allEdges.push(r.result)
  }
  console.log('[04] all edges:', JSON.stringify(allEdges))

  // Get positions to identify which edges are top edges
  // Use getGeometryPositions to find midpoints of each edge
  const posR = await api.v1.part.getGeometryPositions({ elems: allEdges })
  filewrite(posR.result, 'edge-positions')

  for (const entry of posR.result) {
    console.log(`[04] edge ${entry.id}: pos=${JSON.stringify(entry.positions)}`)
  }

  // Filter for top edges (z ≈ 40, the box height)
  const topEdges = posR.result
    .filter(e => e.positions.some(p => Math.abs(p[2] - 40) < 1))
    .map(e => e.id)
  console.log('[04] top edge IDs:', JSON.stringify(topEdges))

  await snapshot('before')

  // Fillet all top edges with radius 8
  const r = await api.v1.solid.fillet({ id: eifId, radius: 8, geomIds: topEdges })
  console.log('[04] fillet result:', r.result)
  console.log('[04] fillet maxLevel:', r.maxLevel)

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'fillet-multi-response')

  await snapshot('after-top-filleted')

  return { partId, eifId, boxId }
}
