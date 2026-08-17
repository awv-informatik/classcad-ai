export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NameTest' })).result

  const box1 = (await api.v1.part.box({ id: partId, name: 'Base', length: 80, width: 60, height: 40 })).result
  const cyl = (await api.v1.part.cylinder({ id: partId, name: 'Cyl', diameter: 30, height: 50, translation: [40, 30, -5] })).result

  const boolId = (await api.v1.part.boolean({
    id: partId, type: 'SUBTRACTION', name: 'OrigName', target: box1, tools: [cyl],
  })).result
  console.log('[03] boolean created:', boolId, 'name: OrigName')

  // Change name only — geometry should NOT change
  await api.v1.part.openFeature({ id: boolId })
  const updateR = await api.v1.part.updateBoolean({ id: boolId, name: 'RenamedBool' })
  console.log('[03] updateBoolean result:', updateR.result, 'maxLevel:', updateR.maxLevel)
  filewrite({ result: updateR.result, messages: updateR.messages, maxLevel: updateR.maxLevel }, 'name-response')
  await api.v1.part.closeFeature({ id: boolId })

  await snapshot('after-rename')

  return { partId, boolId }
}
