// 22 — Does mode affect box vs sphere differently?
// Earlier batch: mode=2 + box → graphic present. Script 21: mode=2 + sphere → no graphic.
export default async function (api, { filewrite }) {
  const results = []

  for (const mode of [0, 1, 2]) {
    // Reset clean
    await api.v1.common.setDatabaseSettings({
      chordHeightTol: 0.1, angleTol: 0, facetingParamsMode: mode,
      isGraphicEnabled: true, isCCGraphicEnabled: true, doCurveTessellation: true
    })

    const partId = (await api.v1.part.create({ name: 'Test' + mode })).result
    const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

    // Box
    const boxR = await api.v1.solid.box({ id: eifId, length: 50, width: 40, height: 30 })
    const boxGfx = boxR.graphic ? JSON.stringify(boxR.graphic).length : 0

    // Sphere
    const sphR = await api.v1.solid.sphere({ id: eifId, radius: 20, translation: [70, 0, 0] })
    const sphGfx = sphR.graphic ? JSON.stringify(sphR.graphic).length : 0

    // Cylinder
    const cylR = await api.v1.solid.cylinder({ id: eifId, height: 40, diameter: 30, translation: [0, 60, 0] })
    const cylGfx = cylR.graphic ? JSON.stringify(cylR.graphic).length : 0

    console.log(`[22] mode=${mode}: box=${boxGfx}, sphere=${sphGfx}, cylinder=${cylGfx}`)
    results.push({ mode, box: boxGfx, sphere: sphGfx, cylinder: cylGfx })
  }

  filewrite(results, 'mode-shape-comparison')

  // Restore
  await api.v1.common.setDatabaseSettings({ chordHeightTol: 0.1, angleTol: 0, facetingParamsMode: 1 })

  return results
}
