// Q2: What does angleTol mean? Sweep values on a sphere, measure vertex counts.
// angleTol = max angle (degrees) between normals of adjacent tessellation facets.
// Smaller angle = more triangles to keep normal changes gradual.
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'AngleSweep' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  const sphId = (await api.v1.solid.sphere({ id: eifId, radius: 20 })).result

  // Test angleTol with chordHeightTol=0 (disabled) and with a constant chord fallback
  const angleTols = [1, 2, 3, 5, 10, 15, 20, 30, 45, 60, 90, 180]
  const results = []

  // First: angle-only (set cht very high so it doesn't constrain)
  for (const at of angleTols) {
    await api.v1.common.setAppearance({ target: eifId, chordHeightTol: 100, angleTol: at })
    const r = await api.v1.common.requestVisualisation({ ids: [sphId] })
    let totalVerts = 0
    for (const c of (r.graphic?.containers || [])) {
      for (const m of (c.meshes || [])) totalVerts += (m.vertices?.length || 0) / 3
    }
    results.push({ angleTol: at, chordHeightTol: 100, vertices: totalVerts })
    console.log(`[02] angleTol=${at}, cht=100: verts=${totalVerts}`)
  }

  filewrite(results, 'angle-sweep')
  return { partId }
}
