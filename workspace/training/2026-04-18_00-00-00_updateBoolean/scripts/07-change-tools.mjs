export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ToolsTest' })).result

  const box1 = (await api.v1.part.box({ id: partId, name: 'Base', length: 80, width: 60, height: 40 })).result
  const cyl1 = (await api.v1.part.cylinder({ id: partId, name: 'Cyl1', diameter: 20, height: 50, translation: [20, 30, -5] })).result
  const cyl2 = (await api.v1.part.cylinder({ id: partId, name: 'Cyl2', diameter: 30, height: 50, translation: [50, 30, -5] })).result

  // Start: SUBTRACTION with Cyl1 as tool
  const boolId = (await api.v1.part.boolean({
    id: partId, type: 'SUBTRACTION', name: 'Sub1', target: box1, tools: [cyl1],
  })).result
  console.log('[07] boolean created:', boolId, 'tools: [Cyl1]')

  await snapshot('before-tool-change')

  // Change tools from Cyl1 to Cyl2
  await api.v1.part.openFeature({ id: boolId })
  const updateR = await api.v1.part.updateBoolean({ id: boolId, tools: [cyl2] })
  console.log('[07] updateBoolean result:', updateR.result, 'maxLevel:', updateR.maxLevel)
  filewrite({ result: updateR.result, messages: updateR.messages, maxLevel: updateR.maxLevel }, 'tool-change-response')
  await api.v1.part.closeFeature({ id: boolId })

  await snapshot('after-tool-change')

  return { partId, boolId }
}
