// 07 — Fillet multiple edges (fixed) — all 4 top edges of a box
// Box 80x60x40 centered at origin: top edges at z=+20
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MultiEdgeFix' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result

  // Get all 12 edges and their positions
  const allEdges = []
  for (let i = 0; i < 12; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: eifId, lineIndex: i })
    if (r.result && r.maxLevel <= 31) allEdges.push(r.result)
  }

  const posR = await api.v1.part.getGeometryPositions({ elems: allEdges })

  // Top edges: midpoint z ≈ 20 (half of height 40)
  const topEdges = posR.result
    .filter(e => e.positions.some(p => Math.abs(p.z - 20) < 1))
    .map(e => e.id)
  console.log('[07] top edges:', JSON.stringify(topEdges), 'count:', topEdges.length)

  // Also identify bottom edges for comparison
  const bottomEdges = posR.result
    .filter(e => e.positions.some(p => Math.abs(p.z - (-20)) < 1))
    .map(e => e.id)
  console.log('[07] bottom edges:', JSON.stringify(bottomEdges), 'count:', bottomEdges.length)

  await snapshot('before')

  // Fillet all 4 top edges
  const r = await api.v1.solid.fillet({ id: eifId, radius: 8, geomIds: topEdges })
  console.log('[07] fillet result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'multi-top-fillet')

  // Count verts to verify geometry changed
  const containers = r.graphic?.containers || []
  for (const c of containers) {
    console.log(`[07] container: id=${c.id}, verts=${c.vertices?.length || 0}`)
  }

  await snapshot('after-top-fillet')

  return { partId, eifId, boxId }
}
