// 21 — Understand mode=2 behavior. Earlier scripts showed mode=2 produces graphic (script 06),
// but script 17 showed mode=1 after clean reset produces graphic only on first sphere.
// Theory: mode=2 always uses factory defaults (chord=0.1, angle=0) ignoring set values.
export default async function (api, { filewrite }) {
  const results = []

  // Test mode=0: global params used, changing chord affects mesh
  for (const mode of [0, 1, 2]) {
    // Clean start
    await api.v1.common.setDatabaseSettings({
      chordHeightTol: 0.1, angleTol: 0, facetingParamsMode: mode,
      isGraphicEnabled: true, isCCGraphicEnabled: true
    })
    const partId = (await api.v1.part.create({ name: 'M' + mode })).result
    const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
    const db = (await api.v1.common.getDatabaseSettings()).result

    const sphR = await api.v1.solid.sphere({ id: eifId, radius: 20 })
    const gfxSize = sphR.graphic ? JSON.stringify(sphR.graphic).length : 0

    let verts = 0
    if (sphR.graphic?.containers) {
      sphR.graphic.containers.forEach(c => c.meshes?.forEach(m => { verts += (m.vertices?.length || 0) / 3 }))
    }

    console.log(`[21] mode=${mode} chord=${db.chordHeightTol}: gfxSize=${gfxSize}, verts=${verts}`)
    results.push({ mode, chord: db.chordHeightTol, gfxSize, verts })
  }

  // Now test mode=2 with different chord values
  for (const chord of [0.01, 0.1, 0.5, 1.0, 2.0]) {
    await api.v1.common.setDatabaseSettings({ chordHeightTol: chord, angleTol: 0, facetingParamsMode: 2 })
    const partId = (await api.v1.part.create({ name: 'M2c' + chord })).result
    const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

    const sphR = await api.v1.solid.sphere({ id: eifId, radius: 20 })
    const gfxSize = sphR.graphic ? JSON.stringify(sphR.graphic).length : 0

    let verts = 0
    if (sphR.graphic?.containers) {
      sphR.graphic.containers.forEach(c => c.meshes?.forEach(m => { verts += (m.vertices?.length || 0) / 3 }))
    }

    console.log(`[21] mode=2 chord=${chord}: gfxSize=${gfxSize}, verts=${verts}`)
    results.push({ mode: 2, chord, gfxSize, verts })
  }

  filewrite(results, 'mode2-behavior')

  // Restore
  await api.v1.common.setDatabaseSettings({ chordHeightTol: 0.1, angleTol: 0, facetingParamsMode: 1 })

  return results
}
