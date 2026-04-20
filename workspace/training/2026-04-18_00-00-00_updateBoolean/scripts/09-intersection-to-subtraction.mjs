export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'IntToSubTest' })).result

  const box1 = (await api.v1.part.box({ id: partId, name: 'Base', length: 80, width: 60, height: 40 })).result
  const box2 = (await api.v1.part.box({ id: partId, name: 'Tool', length: 40, width: 40, height: 60, translation: [20, 10, -10] })).result

  // Start as INTERSECTION
  const boolId = (await api.v1.part.boolean({
    id: partId, type: 'INTERSECTION', name: 'Int', target: box1, tools: [box2],
  })).result
  console.log('[09] boolean created:', boolId, 'type: INTERSECTION')

  await snapshot('before-intersection')

  // Change to SUBTRACTION
  await api.v1.part.openFeature({ id: boolId })
  const updateR = await api.v1.part.updateBoolean({ id: boolId, type: 'SUBTRACTION' })
  console.log('[09] updateBoolean result:', updateR.result, 'maxLevel:', updateR.maxLevel)
  filewrite({ result: updateR.result, messages: updateR.messages, maxLevel: updateR.maxLevel }, 'int-to-sub-response')
  await api.v1.part.closeFeature({ id: boolId })

  await snapshot('after-subtraction')

  return { partId, boolId }
}
