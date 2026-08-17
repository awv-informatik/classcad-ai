export default async function (api, { snapshot, filewrite }) {
  // Test: empty tools array
  const partId = (await api.v1.part.create({ name: 'EmptyTools' })).result
  const box1 = (await api.v1.part.box({ id: partId, name: 'Base', length: 80, width: 60, height: 40 })).result

  const r = await api.v1.part.boolean({
    id: partId,
    type: 'UNION',
    target: box1,
    tools: [],
  })

  console.log('[17] empty tools — result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'empty-tools')

  return { partId }
}
