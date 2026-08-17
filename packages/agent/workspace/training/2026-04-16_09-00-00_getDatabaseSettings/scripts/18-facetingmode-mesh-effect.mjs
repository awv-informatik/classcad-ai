// 18 — Does facetingParamsMode affect mesh generation?
// mode 0 = "default parameters will be used"
// mode 1 = "specific parameters of each entity will be used"
// Test: same geometry at mode 0 vs mode 1
export default async function (api, { filewrite }) {
  // Reset clean
  await api.v1.common.setDatabaseSettings({
    chordHeightTol: 0.1,
    angleTol: 0,
    facetingParamsMode: 1,
    isGraphicEnabled: true,
    isCCGraphicEnabled: true,
    doCurveTessellation: true
  })

  const results = []

  for (const mode of [0, 1]) {
    const partId = (await api.v1.part.create({ name: 'FPM_' + mode })).result
    const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

    await api.v1.common.setDatabaseSettings({ facetingParamsMode: mode })
    const sphR = await api.v1.solid.sphere({ id: eifId, radius: 20 })
    const g = sphR.graphic

    let totalVerts = 0, meshCount = 0
    if (g?.containers) {
      g.containers.forEach(c => {
        c.meshes?.forEach(m => {
          meshCount++
          totalVerts += (m.vertices?.length || 0) / 3
        })
      })
    }

    console.log(`[18] mode=${mode}: meshes=${meshCount}, verts=${totalVerts}, gfxSize=${g ? JSON.stringify(g).length : 0}`)
    results.push({ mode, meshCount, totalVerts, graphicSize: g ? JSON.stringify(g).length : 0 })
  }

  filewrite(results, 'faceting-mode-mesh')

  // Restore
  await api.v1.common.setDatabaseSettings({ facetingParamsMode: 1, chordHeightTol: 0.1, angleTol: 0 })

  return results
}
