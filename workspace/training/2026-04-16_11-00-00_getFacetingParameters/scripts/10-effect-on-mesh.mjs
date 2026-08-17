// Test: do faceting params actually affect tessellation (vertex counts)?
// Create a sphere and compare vertex counts at different chordHeightTol values
export default async function (api, { filewrite }) {
  // Ensure facetingParamsMode=0 so global params apply
  await api.v1.common.setDatabaseSettings({ facetingParamsMode: 0 })

  const results = []

  for (const cht of [0.01, 0.05, 0.1, 0.5, 1.0, 5.0]) {
    await api.v1.common.setFacetingParameters({ chordHeightTol: cht, angleTol: 0 })

    // Create fresh geometry
    const partId = (await api.v1.part.create({ name: 'MeshTest' })).result
    const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
    const sphereR = await api.v1.solid.sphere({ id: eifId, radius: 20 })

    const containers = sphereR.graphic?.containers || []
    let vertCount = 0
    let idxCount = 0
    for (const c of containers) {
      for (const m of c.meshes || []) {
        vertCount += (m.vertices?.length || 0) / 3
        idxCount += m.indices?.length || 0
      }
    }

    console.log(`[10] cht=${cht}: vertices=${vertCount}, indices=${idxCount}`)
    results.push({ chordHeightTol: cht, vertices: vertCount, indices: idxCount })
  }

  filewrite(results, 'mesh-effect')
  return results
}
