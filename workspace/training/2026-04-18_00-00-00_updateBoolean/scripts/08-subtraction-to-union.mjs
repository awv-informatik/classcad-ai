export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SubToUnionTest' })).result

  const box1 = (await api.v1.part.box({ id: partId, name: 'Base', length: 80, width: 60, height: 40 })).result
  const cyl = (await api.v1.part.cylinder({ id: partId, name: 'Cyl', diameter: 30, height: 60, translation: [40, 30, -10] })).result

  // Start as SUBTRACTION
  const boolId = (await api.v1.part.boolean({
    id: partId, type: 'SUBTRACTION', name: 'Sub', target: box1, tools: [cyl],
  })).result
  console.log('[08] boolean created:', boolId, 'type: SUBTRACTION')

  await snapshot('before-subtraction')

  // Change to UNION
  await api.v1.part.openFeature({ id: boolId })
  const updateR = await api.v1.part.updateBoolean({ id: boolId, type: 'UNION' })
  console.log('[08] updateBoolean result:', updateR.result, 'maxLevel:', updateR.maxLevel)
  filewrite({ result: updateR.result, messages: updateR.messages, maxLevel: updateR.maxLevel }, 'sub-to-union-response')
  await api.v1.part.closeFeature({ id: boolId })

  await snapshot('after-union')

  return { partId, boolId }
}
