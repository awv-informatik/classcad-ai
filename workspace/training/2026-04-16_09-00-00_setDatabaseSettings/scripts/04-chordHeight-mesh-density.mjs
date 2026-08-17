// Test chordHeightTol effect on mesh density — compare vertex counts for a sphere
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ChordTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  // Enable graphic data
  await api.v1.common.setDatabaseSettings({ facetingParamsMode: 0 })

  const tolerances = [0.01, 0.05, 0.1, 0.5, 1.0, 5.0]
  const results = []

  for (const tol of tolerances) {
    // Delete previous sphere if any
    await api.v1.common.clear({})
    const pId = (await api.v1.part.create({ name: 'ChordTest' })).result
    const eid = (await api.v1.part.entityInjection({ id: pId, name: 'EIF' })).result

    // Must re-enable after clear resets part but NOT facetingParamsMode
    await api.v1.common.setDatabaseSettings({ facetingParamsMode: 0, chordHeightTol: tol })
    const verify = (await api.v1.common.getDatabaseSettings()).result

    const sphereR = await api.v1.solid.sphere({ id: eid, radius: 20 })
    const hasGraphic = sphereR.graphic && sphereR.graphic.containers && sphereR.graphic.containers.length > 0
    let vertexCount = 0
    let indexCount = 0
    if (hasGraphic && sphereR.graphic.containers[0].meshes && sphereR.graphic.containers[0].meshes.length > 0) {
      const mesh = sphereR.graphic.containers[0].meshes[0]
      vertexCount = mesh.vertices ? mesh.vertices.length / 3 : 0
      indexCount = mesh.indices ? mesh.indices.length : 0
    }
    console.log(`[04] tol=${tol}: vertices=${vertexCount}, indices=${indexCount}, verify.chordHeightTol=${verify.chordHeightTol}`)
    results.push({ tol, vertexCount, indexCount, verifiedTol: verify.chordHeightTol })
  }

  filewrite(results, 'chord-density')
  return { results }
}
