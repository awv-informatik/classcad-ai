// 19 — Does part.create reset database settings?
export default async function (api, { filewrite }) {
  // Set known non-default values
  await api.v1.common.setDatabaseSettings({
    chordHeightTol: 0.77,
    angleTol: 22,
    facetingParamsMode: 0,
    isGraphicEnabled: false,
    isInvisibleGraphicEnabled: true
  })

  const before = (await api.v1.common.getDatabaseSettings()).result
  console.log('[19] Before part.create:', JSON.stringify(before))

  // Create a part (clears drawing)
  const partId = (await api.v1.part.create({ name: 'ResetTest' })).result

  const afterCreate = (await api.v1.common.getDatabaseSettings()).result
  console.log('[19] After part.create:', JSON.stringify(afterCreate))

  // Check which fields changed
  for (const key of Object.keys(before)) {
    if (before[key] !== afterCreate[key]) {
      console.log(`[19] CHANGED: ${key}: ${before[key]} → ${afterCreate[key]}`)
    }
  }

  const changed = Object.keys(before).filter(k => before[k] !== afterCreate[k])
  console.log('[19] Changed fields:', changed.length ? changed.join(', ') : 'NONE')

  filewrite({ before, afterCreate, changedFields: changed }, 'partcreate-reset')

  return { before, afterCreate, changed }
}
