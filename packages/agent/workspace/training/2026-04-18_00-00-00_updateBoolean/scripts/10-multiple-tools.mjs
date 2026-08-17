export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MultiToolTest' })).result

  const box = (await api.v1.part.box({ id: partId, name: 'Base', length: 100, width: 80, height: 30 })).result
  const cyl1 = (await api.v1.part.cylinder({ id: partId, name: 'Hole1', diameter: 15, height: 40, translation: [25, 40, -5] })).result
  const cyl2 = (await api.v1.part.cylinder({ id: partId, name: 'Hole2', diameter: 15, height: 40, translation: [50, 40, -5] })).result
  const cyl3 = (await api.v1.part.cylinder({ id: partId, name: 'Hole3', diameter: 15, height: 40, translation: [75, 40, -5] })).result

  // Start with 1 tool
  const boolId = (await api.v1.part.boolean({
    id: partId, type: 'SUBTRACTION', name: 'Holes', target: box, tools: [cyl1],
  })).result
  console.log('[10] boolean created:', boolId, 'tools: [Hole1]')

  await snapshot('one-hole')

  // Update to multiple tools
  await api.v1.part.openFeature({ id: boolId })
  const updateR = await api.v1.part.updateBoolean({ id: boolId, tools: [cyl2, cyl3] })
  console.log('[10] updateBoolean result:', updateR.result, 'maxLevel:', updateR.maxLevel)
  filewrite({ result: updateR.result, messages: updateR.messages, maxLevel: updateR.maxLevel }, 'multi-tool-response')
  await api.v1.part.closeFeature({ id: boolId })

  await snapshot('two-holes')

  return { partId, boolId }
}
