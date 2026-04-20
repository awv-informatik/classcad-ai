export default async function (api, { snapshot, filewrite }) {
  // Test: omitting type param — docs say default is "UNION"
  const partId = (await api.v1.part.create({ name: 'DefaultType' })).result
  const box1 = (await api.v1.part.box({ id: partId, name: 'Base', length: 80, width: 60, height: 40 })).result
  const box2 = (await api.v1.part.box({ id: partId, name: 'Tool', length: 40, width: 30, height: 60, translation: [50, 20, 0] })).result

  // No type param — should default to UNION
  const r = await api.v1.part.boolean({
    id: partId,
    target: box1,
    tools: [box2],
  })

  console.log('[11] no type — result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'default-type')

  await snapshot('default-type')
  return { partId }
}
