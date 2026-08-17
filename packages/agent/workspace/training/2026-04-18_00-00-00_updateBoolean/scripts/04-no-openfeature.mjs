export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NoGateTest' })).result

  const box1 = (await api.v1.part.box({ id: partId, name: 'Base', length: 80, width: 60, height: 40 })).result
  const box2 = (await api.v1.part.box({ id: partId, name: 'Tool', length: 40, width: 40, height: 60, translation: [20, 10, -10] })).result

  const boolId = (await api.v1.part.boolean({
    id: partId, type: 'UNION', target: box1, tools: [box2],
  })).result
  console.log('[04] boolean created:', boolId)

  // Try to update WITHOUT openFeature
  const updateR = await api.v1.part.updateBoolean({ id: boolId, type: 'SUBTRACTION' })
  console.log('[04] updateBoolean result:', updateR.result, 'maxLevel:', updateR.maxLevel)
  filewrite({ result: updateR.result, messages: updateR.messages, maxLevel: updateR.maxLevel }, 'no-gate-response')

  return { partId, boolId }
}
