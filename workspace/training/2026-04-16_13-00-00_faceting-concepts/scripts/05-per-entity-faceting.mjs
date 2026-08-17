// Q5: How does per-entity faceting work?
// facetingParamsMode=1 should use per-entity params set via setAppearance.
// Test: set different chordHeightTol on two features, verify they get different mesh densities.
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'PerEntity' })).result
  const eif1 = (await api.v1.part.entityInjection({ id: partId, name: 'Fine' })).result
  const eif2 = (await api.v1.part.entityInjection({ id: partId, name: 'Coarse' })).result

  // Two spheres in separate entity injections
  const sph1 = (await api.v1.solid.sphere({ id: eif1, radius: 20 })).result
  const sph2 = (await api.v1.solid.sphere({ id: eif2, radius: 20, translation: [60, 0, 0] })).result

  // Set per-entity faceting via setAppearance
  await api.v1.common.setAppearance({ target: eif1, chordHeightTol: 0.01 })
  await api.v1.common.setAppearance({ target: eif2, chordHeightTol: 5 })

  const getVerts = (r) => {
    let v = 0
    for (const c of (r.graphic?.containers || [])) {
      for (const m of (c.meshes || [])) v += (m.vertices?.length || 0) / 3
    }
    return v
  }

  // mode=1 (per-entity params) — the default
  await api.v1.common.setDatabaseSettings({ facetingParamsMode: 1 })
  const r1 = await api.v1.common.requestVisualisation({ ids: [sph1] })
  const r2 = await api.v1.common.requestVisualisation({ ids: [sph2] })
  const fine = getVerts(r1)
  const coarse = getVerts(r2)
  console.log(`[05] mode=1: fine(cht=0.01)=${fine} verts, coarse(cht=5)=${coarse} verts`)

  // Check reported faceting params on each
  const reportedFine = r1.graphic?.containers?.[0]?.properties?.chordHeightTol
  const reportedCoarse = r2.graphic?.containers?.[0]?.properties?.chordHeightTol
  console.log(`[05] mode=1 reported: fine=${reportedFine}, coarse=${reportedCoarse}`)

  // Now test mode=0 (global params) — should override per-entity
  await api.v1.common.setDatabaseSettings({ facetingParamsMode: 0, chordHeightTol: 0.5 })
  const r3 = await api.v1.common.requestVisualisation({ ids: [sph1] })
  const r4 = await api.v1.common.requestVisualisation({ ids: [sph2] })
  const globalFine = getVerts(r3)
  const globalCoarse = getVerts(r4)
  console.log(`[05] mode=0(cht=0.5): sph1=${globalFine} verts, sph2=${globalCoarse} verts`)

  filewrite({
    mode1: { fine, coarse, reportedFine, reportedCoarse },
    mode0_globalCht05: { sph1: globalFine, sph2: globalCoarse },
  }, 'per-entity')

  // Reset
  await api.v1.common.setDatabaseSettings({ chordHeightTol: 0.1, angleTol: 0, facetingParamsMode: 1 })
  return { partId }
}
