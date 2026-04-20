export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ToolIndicesTest' })).result

  const box1 = (await api.v1.part.box({ id: partId, name: 'Base', length: 80, width: 60, height: 40 })).result
  const box2 = (await api.v1.part.box({ id: partId, name: 'Tool', length: 40, width: 40, height: 60, translation: [20, 10, -10] })).result

  const boolId = (await api.v1.part.boolean({
    id: partId, type: 'UNION', target: box1, tools: [box2],
  })).result
  console.log('[14] boolean created:', boolId)

  // Update tools with object format including indices
  await api.v1.part.openFeature({ id: boolId })
  const updateR = await api.v1.part.updateBoolean({
    id: boolId,
    tools: [{ id: box2, indices: [0] }],
  })
  console.log('[14] updateBoolean tools with indices result:', updateR.result, 'maxLevel:', updateR.maxLevel)
  filewrite({ result: updateR.result, messages: updateR.messages, maxLevel: updateR.maxLevel }, 'tools-indices-response')
  await api.v1.part.closeFeature({ id: boolId })

  await snapshot('after')

  return { partId, boolId }
}
