// Verify mesh effect: changing faceting params changes tessellation vertex count
export default async function (api, { filewrite, snapshot }) {
  // Ensure facetingParamsMode=0 (use global params)
  await api.v1.common.setDatabaseSettings({ facetingParamsMode: 0 })

  // Create a sphere for tessellation testing
  const partId = (await api.v1.part.create({ name: 'FacetTest' })).result

  // Coarse tessellation
  await api.v1.common.setFacetingParameters({ angleTol: 0, chordHeightTol: 5.0 })
  const sphereCoarse = await api.v1.solid.sphere({ id: partId, center: [0, 0, 0], radius: 20 })
  const coarseVerts = sphereCoarse.graphic?.meshes?.[0]?.vertices?.length / 3 || 0
  console.log('[06] coarse verts:', coarseVerts)
  await snapshot('coarse')

  // Clear and recreate with fine tessellation
  await api.v1.common.clear()
  await api.v1.common.setDatabaseSettings({ facetingParamsMode: 0 })
  await api.v1.common.setFacetingParameters({ angleTol: 0, chordHeightTol: 0.01 })
  const partId2 = (await api.v1.part.create({ name: 'FacetTest2' })).result
  const sphereFine = await api.v1.solid.sphere({ id: partId2, center: [0, 0, 0], radius: 20 })
  const fineVerts = sphereFine.graphic?.meshes?.[0]?.vertices?.length / 3 || 0
  console.log('[06] fine verts:', fineVerts)
  await snapshot('fine')

  console.log('[06] ratio fine/coarse:', (fineVerts / coarseVerts).toFixed(1))

  filewrite({
    coarseVerts, fineVerts,
    ratio: fineVerts / coarseVerts,
    meshEffectConfirmed: fineVerts > coarseVerts
  }, 'mesh-effect')

  return { partId: partId2 }
}
