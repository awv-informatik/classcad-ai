// 20 — Clean test: fresh part.create, then test mode 0 vs 1 vs default
// Each test in isolation with a getDatabaseSettings check right before sphere creation
export default async function (api, { filewrite }) {
  const results = []

  // Reset clean
  await api.v1.common.setDatabaseSettings({
    chordHeightTol: 0.1, angleTol: 0, facetingParamsMode: 0,
    isGraphicEnabled: true, isCCGraphicEnabled: true, doCurveTessellation: true,
    isSketchGraphicEnabled: true, isInvisibleGraphicEnabled: false
  })

  // Test 1: mode=0 explicit
  {
    const partId = (await api.v1.part.create({ name: 'Mode0' })).result
    const db = (await api.v1.common.getDatabaseSettings()).result
    console.log('[20] Test1 pre-sphere settings:', JSON.stringify(db))
    const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
    const sphR = await api.v1.solid.sphere({ id: eifId, radius: 20 })
    const gfxSize = sphR.graphic ? JSON.stringify(sphR.graphic).length : 0
    console.log('[20] Test1 mode=0: gfxSize:', gfxSize)
    results.push({ test: 'mode0', mode: db.facetingParamsMode, gfxSize })
  }

  // Test 2: mode=1 after fresh part.create
  {
    await api.v1.common.setDatabaseSettings({ facetingParamsMode: 1 })
    const partId = (await api.v1.part.create({ name: 'Mode1' })).result
    const db = (await api.v1.common.getDatabaseSettings()).result
    console.log('[20] Test2 pre-sphere settings:', JSON.stringify(db))
    const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
    const sphR = await api.v1.solid.sphere({ id: eifId, radius: 20 })
    const gfxSize = sphR.graphic ? JSON.stringify(sphR.graphic).length : 0
    console.log('[20] Test2 mode=1: gfxSize:', gfxSize)
    results.push({ test: 'mode1_after_create', mode: db.facetingParamsMode, gfxSize })
  }

  // Test 3: mode=1 set AFTER part.create
  {
    const partId = (await api.v1.part.create({ name: 'Mode1b' })).result
    await api.v1.common.setDatabaseSettings({ facetingParamsMode: 1 })
    const db = (await api.v1.common.getDatabaseSettings()).result
    console.log('[20] Test3 pre-sphere settings:', JSON.stringify(db))
    const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
    const sphR = await api.v1.solid.sphere({ id: eifId, radius: 20 })
    const gfxSize = sphR.graphic ? JSON.stringify(sphR.graphic).length : 0
    console.log('[20] Test3 mode=1 set after create: gfxSize:', gfxSize)
    results.push({ test: 'mode1_set_after', mode: db.facetingParamsMode, gfxSize })
  }

  filewrite(results, 'mode-graphic-clean')

  // Restore
  await api.v1.common.setDatabaseSettings({ facetingParamsMode: 1, chordHeightTol: 0.1, angleTol: 0 })

  return results
}
