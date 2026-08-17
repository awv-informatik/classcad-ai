export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result

  // Create 3 features
  const box1 = (await api.v1.part.box({ id: partId, name: 'Alpha' })).result
  const box2 = (await api.v1.part.box({ id: partId, name: 'Beta' })).result
  const box3 = (await api.v1.part.box({ id: partId, name: 'Gamma' })).result

  // Open box1 (rollback: box2, box3 are rolled back / below rollbar)
  await api.v1.part.openFeature({ id: box1 })

  // Can we find all three while rolled back?
  const results = {}
  for (const [name, id] of [['Alpha', box1], ['Beta', box2], ['Gamma', box3]]) {
    const r = await api.v1.part.getFeature({ id: partId, name })
    results[name] = { result: r.result, match: r.result === id, maxLevel: r.maxLevel }
    console.log('[15] rolled back "' + name + '":', r.result, 'maxLevel:', r.maxLevel)
  }

  // Close feature to restore
  await api.v1.part.closeFeature({ id: partId })

  // Verify all findable again
  for (const [name, id] of [['Alpha', box1], ['Beta', box2], ['Gamma', box3]]) {
    const r = await api.v1.part.getFeature({ id: partId, name })
    results[name + '_restored'] = { result: r.result, match: r.result === id }
    console.log('[15] restored "' + name + '":', r.result, 'match:', r.result === id)
  }

  filewrite(results, 'rollback-state')
  return { partId }
}
