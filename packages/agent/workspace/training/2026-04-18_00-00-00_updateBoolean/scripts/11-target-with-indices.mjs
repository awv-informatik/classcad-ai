export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'IndicesTest' })).result

  const box1 = (await api.v1.part.box({ id: partId, name: 'Base', length: 80, width: 60, height: 40 })).result
  const box2 = (await api.v1.part.box({ id: partId, name: 'Tool', length: 40, width: 40, height: 60, translation: [20, 10, -10] })).result

  // Create UNION boolean
  const boolId = (await api.v1.part.boolean({
    id: partId, type: 'UNION', name: 'UnionBool', target: box1, tools: [box2],
  })).result
  console.log('[11] boolean created:', boolId)

  await snapshot('before')

  // Update target with indices parameter
  await api.v1.part.openFeature({ id: boolId })
  const updateR = await api.v1.part.updateBoolean({ id: boolId, target: { id: box1, indices: [0] } })
  console.log('[11] updateBoolean with target.indices result:', updateR.result, 'maxLevel:', updateR.maxLevel)
  filewrite({ result: updateR.result, messages: updateR.messages, maxLevel: updateR.maxLevel }, 'indices-response')
  await api.v1.part.closeFeature({ id: boolId })

  await snapshot('after-indices')

  return { partId, boolId }
}
