// 16 — Do settings survive save/load cycle (are they stored in the OFB file)?
export default async function (api, { filewrite }) {
  // Create part with geometry
  const partId = (await api.v1.part.create({ name: 'SaveLoadSettings' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  await api.v1.solid.box({ id: eifId, length: 50, width: 40, height: 30 })

  // Set non-default settings
  await api.v1.common.setDatabaseSettings({ chordHeightTol: 0.77, angleTol: 22, facetingParamsMode: 0 })
  const beforeSave = (await api.v1.common.getDatabaseSettings()).result
  console.log('[16] Before save: chord=', beforeSave.chordHeightTol, 'angle=', beforeSave.angleTol, 'mode=', beforeSave.facetingParamsMode)

  // Save
  const saveRes = (await api.v1.common.save({ format: 'OFB', encoding: 'base64' })).result

  // Reset settings to defaults
  await api.v1.common.setDatabaseSettings({ chordHeightTol: 0.1, angleTol: 0, facetingParamsMode: 1 })
  const afterReset = (await api.v1.common.getDatabaseSettings()).result
  console.log('[16] After reset: chord=', afterReset.chordHeightTol, 'angle=', afterReset.angleTol, 'mode=', afterReset.facetingParamsMode)

  // Clear and load
  await api.v1.common.clear({})
  await api.v1.common.load({ data: saveRes.content, format: 'OFB', encoding: 'base64' })

  const afterLoad = (await api.v1.common.getDatabaseSettings()).result
  console.log('[16] After load: chord=', afterLoad.chordHeightTol, 'angle=', afterLoad.angleTol, 'mode=', afterLoad.facetingParamsMode)
  console.log('[16] Settings restored from file:', afterLoad.chordHeightTol === 0.77 && afterLoad.angleTol === 22)

  filewrite({ beforeSave, afterReset, afterLoad }, 'save-load-settings')

  // Restore defaults
  await api.v1.common.setDatabaseSettings({ chordHeightTol: 0.1, angleTol: 0, facetingParamsMode: 1 })

  return { beforeSave, afterReset, afterLoad }
}
