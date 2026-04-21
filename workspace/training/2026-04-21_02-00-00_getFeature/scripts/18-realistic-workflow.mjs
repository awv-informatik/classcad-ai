export default async function (api, { filewrite, snapshot }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result

  // Build a realistic model with named features
  const baseId = (await api.v1.part.box({
    id: partId, name: 'Base', length: 100, width: 80, height: 20
  })).result
  const pillarId = (await api.v1.part.cylinder({
    id: partId, name: 'Pillar', radius: 15, height: 60
  })).result

  // Boolean union
  const unionId = (await api.v1.part.boolean({
    id: partId, name: 'Assembly', type: 'UNION', target: baseId, tools: [pillarId]
  })).result

  await snapshot('model')

  // Now look up features by name — simulating an agent that needs to find features
  const features = ['Base', 'Pillar', 'Assembly']
  const lookups = {}
  for (const name of features) {
    const r = await api.v1.part.getFeature({ id: partId, name })
    lookups[name] = { result: r.result, maxLevel: r.maxLevel }
    console.log('[18] "' + name + '":', r.result)
  }

  // Use the found feature ID to modify it (update the base box)
  const foundBaseId = lookups['Base'].result
  if (foundBaseId) {
    const upR = await api.v1.part.updateBox({ id: foundBaseId, height: 40 })
    console.log('[18] updateBox via getFeature ID — maxLevel:', upR.maxLevel)
    await snapshot('updated')
  }

  filewrite(lookups, 'workflow')
  return { partId }
}
