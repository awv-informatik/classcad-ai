export default async function (api, { snapshot, filewrite }) {
  // Test: updateBoolean to change the name
  const partId = (await api.v1.part.create({ name: 'UpdateName' })).result
  const box1 = (await api.v1.part.box({ id: partId, name: 'Base', length: 80, width: 60, height: 40 })).result
  const box2 = (await api.v1.part.box({ id: partId, name: 'Tool', length: 40, width: 30, height: 60, translation: [50, 20, 0] })).result

  const boolId = (await api.v1.part.boolean({
    id: partId,
    type: 'UNION',
    name: 'OrigName',
    target: box1,
    tools: [box2],
  })).result

  console.log('[16] boolId:', boolId)

  // Update name
  await api.v1.part.openFeature({ id: boolId })
  const r = await api.v1.part.updateBoolean({
    id: boolId,
    name: 'RenamedBool',
  })
  await api.v1.part.closeFeature({ id: boolId })

  console.log('[16] rename — result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'rename-response')

  return { partId }
}
