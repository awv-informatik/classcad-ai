export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result

  // Create 3 boxes in order
  const box1 = (await api.v1.part.box({ id: partId, name: 'First' })).result
  const box2 = (await api.v1.part.box({ id: partId, name: 'Second' })).result
  const box3 = (await api.v1.part.box({ id: partId, name: 'Third' })).result
  console.log('[14] box1:', box1, 'box2:', box2, 'box3:', box3)

  // Verify all findable before move
  for (const [name, id] of [['First', box1], ['Second', box2], ['Third', box3]]) {
    const r = await api.v1.part.getFeature({ id: partId, name })
    console.log('[14] before move "' + name + '":', r.result, 'match:', r.result === id)
  }

  // Move Third before First using operationMoveBefore
  await api.v1.part.operationMoveBefore({ id: box3, target: box1 })

  // Verify all still findable after move
  const results = {}
  for (const [name, id] of [['First', box1], ['Second', box2], ['Third', box3]]) {
    const r = await api.v1.part.getFeature({ id: partId, name })
    results[name] = { result: r.result, match: r.result === id }
    console.log('[14] after move "' + name + '":', r.result, 'match:', r.result === id)
  }

  filewrite(results, 'after-move')
  return { partId }
}
