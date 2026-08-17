// Test persistence of setDatabaseSettings across clear() and part.create()
export default async function (api, { filewrite }) {
  // Set non-default values
  await api.v1.common.setDatabaseSettings({
    facetingParamsMode: 0,
    chordHeightTol: 0.5,
    angleTol: 15,
    isGraphicEnabled: 0,
    doCurveTessellation: 0,
  })
  const beforeClear = (await api.v1.common.getDatabaseSettings()).result
  console.log('[07] before clear:', JSON.stringify(beforeClear))

  // Clear drawing
  await api.v1.common.clear({})
  const afterClear = (await api.v1.common.getDatabaseSettings()).result
  console.log('[07] after clear:', JSON.stringify(afterClear))

  // Check what survived clear
  const clearSurvivors = {}
  for (const key of Object.keys(beforeClear)) {
    clearSurvivors[key] = { before: beforeClear[key], after: afterClear[key], survived: beforeClear[key] === afterClear[key] }
  }
  console.log('[07] clear survivors:', Object.entries(clearSurvivors).map(([k,v]) => `${k}:${v.survived}`).join(', '))

  // Now create a new part
  const partId = (await api.v1.part.create({ name: 'PersistTest' })).result
  const afterCreate = (await api.v1.common.getDatabaseSettings()).result
  console.log('[07] after part.create:', JSON.stringify(afterCreate))

  const createSurvivors = {}
  for (const key of Object.keys(afterClear)) {
    createSurvivors[key] = { afterClear: afterClear[key], afterCreate: afterCreate[key], survived: afterClear[key] === afterCreate[key] }
  }
  console.log('[07] create survivors:', Object.entries(createSurvivors).map(([k,v]) => `${k}:${v.survived}`).join(', '))

  filewrite({ beforeClear, afterClear, afterCreate, clearSurvivors, createSurvivors }, 'persistence')
  return { partId }
}
