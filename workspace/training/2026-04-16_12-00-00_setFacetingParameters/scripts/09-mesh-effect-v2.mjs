// Verify mesh effect: setFacetingParameters changes tessellation vertex count
// Use entityInjection + containers path (from prior session)
export default async function (api, { filewrite, snapshot }) {
  // Coarse tessellation
  await api.v1.common.setDatabaseSettings({ facetingParamsMode: 0 })
  await api.v1.common.setFacetingParameters({ angleTol: 0, chordHeightTol: 5.0 })

  const partId1 = (await api.v1.part.create({ name: 'Coarse' })).result
  const eif1 = (await api.v1.part.entityInjection({ id: partId1, name: 'EIF1' })).result
  const r1 = await api.v1.solid.sphere({ id: eif1, radius: 20 })

  let coarseVerts = 0
  for (const c of r1.graphic?.containers || []) {
    for (const m of c.meshes || []) {
      coarseVerts += (m.vertices?.length || 0) / 3
    }
  }
  console.log('[09] coarse (cht=5.0) verts:', coarseVerts)
  await snapshot('coarse')

  // Clear and recreate with fine tessellation
  await api.v1.common.clear()
  await api.v1.common.setDatabaseSettings({ facetingParamsMode: 0 })
  await api.v1.common.setFacetingParameters({ angleTol: 0, chordHeightTol: 0.01 })

  const partId2 = (await api.v1.part.create({ name: 'Fine' })).result
  const eif2 = (await api.v1.part.entityInjection({ id: partId2, name: 'EIF2' })).result
  const r2 = await api.v1.solid.sphere({ id: eif2, radius: 20 })

  let fineVerts = 0
  for (const c of r2.graphic?.containers || []) {
    for (const m of c.meshes || []) {
      fineVerts += (m.vertices?.length || 0) / 3
    }
  }
  console.log('[09] fine (cht=0.01) verts:', fineVerts)
  await snapshot('fine')

  const ratio = coarseVerts > 0 ? (fineVerts / coarseVerts).toFixed(1) : 'N/A'
  console.log('[09] ratio fine/coarse:', ratio)
  console.log('[09] mesh effect confirmed:', fineVerts > coarseVerts)

  filewrite({
    coarseVerts, fineVerts, ratio: parseFloat(ratio) || 0,
    meshEffectConfirmed: fineVerts > coarseVerts
  }, 'mesh-effect-v2')

  return { partId: partId2 }
}
