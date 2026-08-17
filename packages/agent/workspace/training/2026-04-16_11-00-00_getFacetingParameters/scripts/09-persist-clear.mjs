// Test: do faceting params persist across common.clear() and part.create()?
export default async function (api, { filewrite }) {
  // Set non-default values
  await api.v1.common.setFacetingParameters({ angleTol: 12, chordHeightTol: 0.25 })
  const before = (await api.v1.common.getFacetingParameters()).result
  console.log('[09] before clear:', JSON.stringify(before))

  // Clear
  await api.v1.common.clear({})
  const afterClear = (await api.v1.common.getFacetingParameters()).result
  console.log('[09] after clear:', JSON.stringify(afterClear))
  console.log('[09] survived clear?', JSON.stringify(before) === JSON.stringify(afterClear))

  // Create new part
  await api.v1.part.create({ name: 'PersistTest' })
  const afterCreate = (await api.v1.common.getFacetingParameters()).result
  console.log('[09] after part.create:', JSON.stringify(afterCreate))
  console.log('[09] survived part.create?', JSON.stringify(before) === JSON.stringify(afterCreate))

  filewrite({ before, afterClear, afterCreate }, 'persist-clear')
  return { before, afterClear, afterCreate }
}
