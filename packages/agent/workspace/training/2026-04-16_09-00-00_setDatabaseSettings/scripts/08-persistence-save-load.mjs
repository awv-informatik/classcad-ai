// Test persistence of setDatabaseSettings across save/load cycle
export default async function (api, { filewrite }) {
  // Create geometry to have something to save
  const partId = (await api.v1.part.create({ name: 'SaveLoadTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  await api.v1.solid.box({ id: eifId, length: 40, width: 30, height: 20 })

  // Set non-default values
  await api.v1.common.setDatabaseSettings({
    facetingParamsMode: 0,
    chordHeightTol: 0.3,
    angleTol: 20,
    isGraphicEnabled: 0,
    isCCGraphicEnabled: 0,
    isInvisibleGraphicEnabled: 1,
    isSketchGraphicEnabled: 0,
    doCurveTessellation: 0,
  })
  const beforeSave = (await api.v1.common.getDatabaseSettings()).result
  console.log('[08] before save:', JSON.stringify(beforeSave))

  // Save
  const saveR = (await api.v1.common.save({ format: 'OFB', encoding: 'base64' })).result
  console.log('[08] saved OFB, content length:', saveR.content.length)

  // Reset to defaults by setting known default values
  await api.v1.common.setDatabaseSettings({
    facetingParamsMode: 1,
    chordHeightTol: 0.1,
    angleTol: 0,
    isGraphicEnabled: 1,
    isCCGraphicEnabled: 1,
    isInvisibleGraphicEnabled: 0,
    isSketchGraphicEnabled: 1,
    doCurveTessellation: 1,
  })
  const afterReset = (await api.v1.common.getDatabaseSettings()).result
  console.log('[08] after manual reset:', JSON.stringify(afterReset))

  // Load
  await api.v1.common.load({ data: saveR.content, format: 'OFB', encoding: 'base64' })
  const afterLoad = (await api.v1.common.getDatabaseSettings()).result
  console.log('[08] after load:', JSON.stringify(afterLoad))

  // Check what survived the save/load cycle
  const loadSurvivors = {}
  for (const key of Object.keys(beforeSave)) {
    loadSurvivors[key] = {
      original: beforeSave[key],
      afterLoad: afterLoad[key],
      survived: beforeSave[key] === afterLoad[key],
    }
  }
  console.log('[08] save/load survivors:')
  for (const [key, val] of Object.entries(loadSurvivors)) {
    console.log(`[08]   ${key}: ${val.original} -> ${val.afterLoad} (${val.survived ? 'survived' : 'RESET'})`)
  }

  filewrite({ beforeSave, afterReset, afterLoad, loadSurvivors }, 'save-load')
  return {}
}
