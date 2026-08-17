export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})

  // Get front-left vertical edge
  const geoR = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [0, 0, 20] }],
  })
  const edgeId = geoR.result.lines[0]
  console.log('[10] edge to fillet:', edgeId)

  // Fillet
  const filletId = (await api.v1.part.fillet({ id: partId, references: [edgeId], radius: 8 })).result
  await api.v1.common.recalc({})
  console.log('[10] filletId:', filletId)

  // The fillet on the front-left vertical edge (x=0,y=0) creates arcs at z=0 and z=40
  // Arc center at (0,0,z), radius 8 in XY plane
  // Midpoint of arc at 45°: (8*cos(45°), 8*sin(45°), z) ≈ (5.66, 5.66, z)
  const cos45 = Math.cos(Math.PI / 4) * 8
  console.log('[10] probing at arc midpoint:', cos45.toFixed(3), cos45.toFixed(3))

  const geoPost = await api.v1.part.getGeometryIds({
    id: partId,
    arcs: [
      { pos: [cos45, cos45, 0] },   // bottom fillet arc
      { pos: [cos45, cos45, 40] },  // top fillet arc
    ],
    lines: [
      { pos: [8, 0, 20] },  // new straight edge on front face (moved from x=0 to x=8)
      { pos: [0, 8, 20] },  // new straight edge on left face (moved from y=0 to y=8)
    ],
  })
  console.log('[10] arcs found:', JSON.stringify(geoPost.result.arcs), 'maxLevel:', geoPost.maxLevel)
  console.log('[10] lines found:', JSON.stringify(geoPost.result.lines))

  const results = []

  // Index the arc edges
  if (geoPost.result.arcs) {
    for (let i = 0; i < geoPost.result.arcs.length; i++) {
      const arcId = geoPost.result.arcs[i]
      if (!arcId || (Array.isArray(arcId) && arcId.length === 0)) {
        console.log('[10] arc', i, 'not found')
        continue
      }
      const r = await api.v1.part.getBrepGeometryIndex({ id: filletId, geomId: arcId })
      console.log('[10] arc', i, 'id:', arcId, '→ index:', r.result, 'maxLevel:', r.maxLevel)
      results.push({ type: 'arc', i, id: arcId, index: r.result })

      // Round-trip
      if (r.result !== null && r.result >= 0) {
        const rt = await api.v1.part.getBrepGeometryByIndex({ id: filletId, arcIndex: r.result })
        console.log('[10] round-trip: index', r.result, '→ id', rt.result, arcId === rt.result ? '✓' : '❌')
      }
    }
  }

  filewrite(results, 'fillet-arc-indices')
  await snapshot('fillet-result')
  return { partId }
}
