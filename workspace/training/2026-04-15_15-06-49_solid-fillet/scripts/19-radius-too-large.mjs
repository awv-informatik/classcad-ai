// 19 — Radius truly too large: fillet a box edge with radius > half the shortest adjacent dimension
// Box 40x30x20. Shortest dimension=20, so half=10.
// Try radius=20 on a 20-height edge. Adjacent faces are 30 and 40 wide,
// but the edge is only 20 long.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TooLargeRadius' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  // Small box to make failures more likely
  const boxId = (await api.v1.solid.box({ id: eifId, length: 40, width: 30, height: 20 })).result

  // Get all edges and positions
  const allEdges = []
  for (let i = 0; i < 12; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: eifId, lineIndex: i })
    if (r.result && r.maxLevel <= 31) allEdges.push(r.result)
  }

  const posR = await api.v1.part.getGeometryPositions({ elems: allEdges })

  // Find a short edge (height=20, so height edges connect z=-10 to z=10, midpoint z=0)
  const shortEdge = posR.result.find(e => Math.abs(e.positions[0]?.z) < 1)
  console.log('[19] short edge:', shortEdge?.id, 'pos:', JSON.stringify(shortEdge?.positions))

  // Try radius=12 (larger than half of 20=10)
  const r1 = await api.v1.solid.fillet({ id: eifId, radius: 12, geomIds: [shortEdge.id] })
  console.log('[19] radius=12 result:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) {
    for (const m of r1.messages) console.log(`[19] msg12: level=${m.level} "${m.message}"`)
  }
  filewrite({ radius: 12, result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages }, 'radius-12')

  // Try radius=16 (getting more extreme)
  if (r1.maxLevel <= 31) {
    // Need to recreate since the solid was modified
    const partId2 = (await api.v1.part.create({ name: 'TooLargeRadius2' })).result
    const eifId2 = (await api.v1.part.entityInjection({ id: partId2, name: 'EIF2' })).result
    const boxId2 = (await api.v1.solid.box({ id: eifId2, length: 40, width: 30, height: 20 })).result
    const e2 = (await api.v1.part.getBrepGeometryByIndex({ id: eifId2, lineIndex: 0 })).result

    const r2 = await api.v1.solid.fillet({ id: eifId2, radius: 16, geomIds: [e2] })
    console.log('[19] radius=16 result:', r2.result, 'maxLevel:', r2.maxLevel)
    if (r2.messages?.length) {
      for (const m of r2.messages) console.log(`[19] msg16: level=${m.level} "${m.message}"`)
    }
    filewrite({ radius: 16, result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages }, 'radius-16')
  }

  return { partId }
}
