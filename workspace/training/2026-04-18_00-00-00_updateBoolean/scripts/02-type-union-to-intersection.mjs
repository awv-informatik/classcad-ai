export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'IntTest' })).result

  const box1 = (await api.v1.part.box({ id: partId, name: 'Base', length: 80, width: 60, height: 40 })).result
  const box2 = (await api.v1.part.box({ id: partId, name: 'Tool', length: 40, width: 40, height: 60, translation: [20, 10, -10] })).result

  const boolId = (await api.v1.part.boolean({
    id: partId, type: 'UNION', name: 'MyBool', target: box1, tools: [box2],
  })).result
  console.log('[02] boolean created:', boolId, 'type: UNION')

  await snapshot('before-union')

  // Change to INTERSECTION
  await api.v1.part.openFeature({ id: boolId })
  const updateR = await api.v1.part.updateBoolean({ id: boolId, type: 'INTERSECTION' })
  console.log('[02] updateBoolean result:', updateR.result, 'maxLevel:', updateR.maxLevel)
  filewrite({ result: updateR.result, messages: updateR.messages, maxLevel: updateR.maxLevel }, 'intersection-response')
  await api.v1.part.closeFeature({ id: boolId })

  await snapshot('after-intersection')

  return { partId, boolId }
}
