// Test: proper mesh effect test — set mode=0 and faceting before EACH geometry creation
export default async function (api, { filewrite }) {
  const results = []

  for (const cht of [0.01, 0.05, 0.1, 0.5, 1.0, 5.0]) {
    // Set BOTH mode and faceting each time
    await api.v1.common.setDatabaseSettings({ facetingParamsMode: 0, chordHeightTol: cht, angleTol: 0 })

    // Verify settings
    const settings = (await api.v1.common.getDatabaseSettings()).result
    console.log(`[20] cht=${cht}: mode=${settings.facetingParamsMode}, cht=${settings.chordHeightTol}`)

    // Fresh geometry
    const partId = (await api.v1.part.create({ name: 'Test' })).result
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

    console.log(`[20]   → vertices=${vertCount}, indices=${idxCount}`)
    results.push({ chordHeightTol: cht, vertices: vertCount, indices: idxCount })
  }

  filewrite(results, 'mesh-proper')
  return results
}
