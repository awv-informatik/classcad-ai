// Test: debug why mesh data disappears — check facetingParamsMode after setFacetingParameters
export default async function (api, { filewrite }) {
  // Set mode 0 initially
  await api.v1.common.setDatabaseSettings({ facetingParamsMode: 0 })
  const before = (await api.v1.common.getDatabaseSettings()).result
  console.log('[19] before — facetingParamsMode:', before.facetingParamsMode, 'cht:', before.chordHeightTol)

  // Call setFacetingParameters
  await api.v1.common.setFacetingParameters({ angleTol: 0, chordHeightTol: 0.5 })
  const after = (await api.v1.common.getDatabaseSettings()).result
  console.log('[19] after setFacetingParameters — facetingParamsMode:', after.facetingParamsMode, 'cht:', after.chordHeightTol)

  // Does setFacetingParameters reset facetingParamsMode?
  console.log('[19] mode changed?', before.facetingParamsMode !== after.facetingParamsMode)

  // Create geometry and check graphic data
  const partId = (await api.v1.part.create({ name: 'MeshDebug' })).result

  // Check if part.create resets mode
  const afterCreate = (await api.v1.common.getDatabaseSettings()).result
  console.log('[19] after part.create — facetingParamsMode:', afterCreate.facetingParamsMode)

  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  const sphereR = await api.v1.solid.sphere({ id: eifId, radius: 20 })

  const containers = sphereR.graphic?.containers || []
  let vertCount = 0
  for (const c of containers) {
    for (const m of c.meshes || []) {
      vertCount += (m.vertices?.length || 0) / 3
    }
  }
  console.log('[19] vertices with mode=' + afterCreate.facetingParamsMode + ':', vertCount)

  filewrite({
    beforeMode: before.facetingParamsMode,
    afterSetFaceting: after.facetingParamsMode,
    afterPartCreate: afterCreate.facetingParamsMode,
    vertices: vertCount,
  }, 'mesh-debug')
  return { vertices: vertCount }
}
