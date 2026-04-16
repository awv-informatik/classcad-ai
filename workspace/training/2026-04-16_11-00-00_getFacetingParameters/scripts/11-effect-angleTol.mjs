// Test: effect of angleTol on tessellation with fixed chordHeightTol
export default async function (api, { filewrite }) {
  await api.v1.common.setDatabaseSettings({ facetingParamsMode: 0 })

  const results = []

  for (const at of [0, 1, 5, 10, 15, 20, 30, 45, 90]) {
    await api.v1.common.setFacetingParameters({ chordHeightTol: 0.1, angleTol: at })

    const partId = (await api.v1.part.create({ name: 'AngleTest' })).result
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

    console.log(`[11] angleTol=${at}: vertices=${vertCount}, indices=${idxCount}`)
    results.push({ angleTol: at, vertices: vertCount, indices: idxCount })
  }

  filewrite(results, 'angle-effect')
  return results
}
