// 17 — Isolate the mesh quality issue from script 15
// All iterations after the first showed 0 verts. Is it facetingParamsMode=2 from prior scripts?
// Reset everything cleanly first.
export default async function (api, { filewrite }) {
  // Reset to known defaults
  await api.v1.common.setDatabaseSettings({
    chordHeightTol: 0.1,
    angleTol: 0,
    facetingParamsMode: 1,
    isGraphicEnabled: true,
    isCCGraphicEnabled: true,
    doCurveTessellation: true,
    isSketchGraphicEnabled: true,
    isInvisibleGraphicEnabled: false
  })

  const db = (await api.v1.common.getDatabaseSettings()).result
  console.log('[17] Settings after reset:', JSON.stringify(db))

  const results = []

  for (const [chord, angle, label] of [
    [0.1, 0, 'fine'],
    [0.5, 0, 'coarse'],
    [1.0, 0, 'very-coarse'],
    [0.01, 0, 'ultra-fine'],
    [0.1, 15, 'angle15'],
    [0.1, 30, 'angle30'],
  ]) {
    const partId = (await api.v1.part.create({ name: 'MQ_' + label })).result
    const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

    await api.v1.common.setDatabaseSettings({ chordHeightTol: chord, angleTol: angle })
    const sphR = await api.v1.solid.sphere({ id: eifId, radius: 20 })
    const g = sphR.graphic

    let totalVerts = 0, totalIndices = 0, meshCount = 0
    const hasGraphic = g !== null && g !== undefined
    const hasContainers = hasGraphic && g.containers && g.containers.length > 0

    if (hasContainers) {
      g.containers.forEach(c => {
        if (c.meshes) {
          c.meshes.forEach(m => {
            meshCount++
            totalVerts += (m.vertices?.length || 0) / 3
            totalIndices += (m.indices?.length || 0)
          })
        }
      })
    }

    const entry = { label, chord, angle, hasGraphic, hasContainers, meshCount, totalVerts, totalIndices, graphicSize: hasGraphic ? JSON.stringify(g).length : 0 }
    console.log(`[17] ${label}: chord=${chord} angle=${angle}: meshes=${meshCount}, ${totalVerts} verts, ${totalIndices} indices, gfxSize=${entry.graphicSize}`)
    results.push(entry)
  }

  filewrite(results, 'mesh-quality-isolated')

  // Restore defaults
  await api.v1.common.setDatabaseSettings({ chordHeightTol: 0.1, angleTol: 0, facetingParamsMode: 1 })

  return results
}
