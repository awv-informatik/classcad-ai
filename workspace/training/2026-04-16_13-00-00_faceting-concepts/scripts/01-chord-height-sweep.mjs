// Q1: What does chordHeightTol mean? Sweep values on a sphere, measure vertex counts.
// Chord height = max perpendicular distance from true curved surface to flat tessellation triangle.
// Lower tolerance = more triangles = closer to true surface.
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ChordSweep' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  const sphId = (await api.v1.solid.sphere({ id: eifId, radius: 20 })).result
  console.log('[01] sphere created:', sphId)

  // Sweep chordHeightTol values from very fine to very coarse
  const tolerances = [0.001, 0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10]
  const results = []

  for (const cht of tolerances) {
    // Set per-entity faceting via setAppearance (works regardless of mode)
    await api.v1.common.setAppearance({ target: eifId, chordHeightTol: cht, angleTol: 0 })
    const r = await api.v1.common.requestVisualisation({ ids: [sphId] })
    const containers = r.graphic?.containers || []
    let totalVerts = 0
    let totalIndices = 0
    let totalEdgePoints = 0
    for (const c of containers) {
      for (const m of (c.meshes || [])) {
        totalVerts += (m.vertices?.length || 0) / 3
        totalIndices += (m.indices?.length || 0)
      }
      for (const e of (c.edges || [])) {
        totalEdgePoints += (e.points?.length || 0) / 3
      }
    }
    const reportedCht = containers[0]?.properties?.chordHeightTol
    results.push({ chordHeightTol: cht, reported: reportedCht, vertices: totalVerts, indices: totalIndices, edgePoints: totalEdgePoints })
    console.log(`[01] cht=${cht}: verts=${totalVerts}, idx=${totalIndices}, edgePts=${totalEdgePoints}, reported=${reportedCht}`)
  }

  filewrite(results, 'chord-sweep')
  return { partId }
}
