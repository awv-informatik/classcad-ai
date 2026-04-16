// Test "sets current AND initial" — does setDatabaseSettings define reset behavior?
// After setDatabaseSettings, what are the settings after a fresh part.create()?
export default async function (api, { filewrite }) {
  // Set non-default values (these should become "initial" too)
  await api.v1.common.setDatabaseSettings({
    chordHeightTol: 0.75,
    angleTol: 12,
    facetingParamsMode: 0,
    doCurveTessellation: 0,
  })
  const afterSet = (await api.v1.common.getDatabaseSettings()).result
  console.log('[13] after setDatabaseSettings:', JSON.stringify(afterSet))

  // Create a new part (which clears drawing)
  await api.v1.part.create({ name: 'InitTest' })
  const afterCreate = (await api.v1.common.getDatabaseSettings()).result
  console.log('[13] after part.create:', JSON.stringify(afterCreate))

  // Do settings persist? (We already know from script 07 they do)
  // But the docs say "sets current AND initial" — does "initial" mean something separate?

  // Let's try clear() then check
  await api.v1.common.clear({})
  const afterClear = (await api.v1.common.getDatabaseSettings()).result
  console.log('[13] after clear:', JSON.stringify(afterClear))

  // Compare
  console.log('[13] same after create:', JSON.stringify(afterSet) === JSON.stringify(afterCreate))
  console.log('[13] same after clear:', JSON.stringify(afterSet) === JSON.stringify(afterClear))

  filewrite({ afterSet, afterCreate, afterClear }, 'initial-settings')
  return {}
}
