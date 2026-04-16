// Test setting ALL fields at once in a single call
export default async function (api, { filewrite }) {
  // Reset to known defaults
  await api.v1.common.setDatabaseSettings({
    isGraphicEnabled: 1, isCCGraphicEnabled: 1, isInvisibleGraphicEnabled: 0,
    isSketchGraphicEnabled: 1, facetingParamsMode: 1, chordHeightTol: 0.1,
    angleTol: 0, doCurveTessellation: 1,
  })
  const before = (await api.v1.common.getDatabaseSettings()).result
  console.log('[12] before:', JSON.stringify(before))

  // Set ALL fields to non-default values in one call
  const r = await api.v1.common.setDatabaseSettings({
    isGraphicEnabled: 0,
    isCCGraphicEnabled: 0,
    isInvisibleGraphicEnabled: 1,
    isSketchGraphicEnabled: 0,
    facetingParamsMode: 0,
    chordHeightTol: 0.25,
    angleTol: 10,
    doCurveTessellation: 0,
  })
  console.log('[12] set all: maxLevel:', r.maxLevel)
  const after = (await api.v1.common.getDatabaseSettings()).result
  console.log('[12] after:', JSON.stringify(after))

  // Verify each field changed
  const changes = {}
  for (const key of Object.keys(before)) {
    changes[key] = { before: before[key], after: after[key], changed: before[key] !== after[key] }
  }
  const allChanged = Object.values(changes).every(v => v.changed)
  console.log('[12] all fields changed:', allChanged)

  filewrite({ before, after, changes }, 'multi-field')
  return {}
}
