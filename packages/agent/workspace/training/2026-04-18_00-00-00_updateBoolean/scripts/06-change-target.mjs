export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TargetTest' })).result

  const box1 = (await api.v1.part.box({ id: partId, name: 'SmallBox', length: 40, width: 40, height: 40 })).result
  const box2 = (await api.v1.part.box({ id: partId, name: 'BigBox', length: 80, width: 60, height: 50, translation: [10, 10, -5] })).result
  const cyl = (await api.v1.part.cylinder({ id: partId, name: 'Cyl', diameter: 20, height: 60, translation: [20, 20, -10] })).result

  // Start: SUBTRACTION with SmallBox as target, Cyl as tool
  const boolId = (await api.v1.part.boolean({
    id: partId, type: 'SUBTRACTION', name: 'Sub1', target: box1, tools: [cyl],
  })).result
  console.log('[06] boolean created:', boolId, 'target: SmallBox, tools: [Cyl]')

  await snapshot('before-target-change')

  // Change target to BigBox
  await api.v1.part.openFeature({ id: boolId })
  const updateR = await api.v1.part.updateBoolean({ id: boolId, target: { id: box2 } })
  console.log('[06] updateBoolean result:', updateR.result, 'maxLevel:', updateR.maxLevel)
  filewrite({ result: updateR.result, messages: updateR.messages, maxLevel: updateR.maxLevel }, 'target-change-response')
  await api.v1.part.closeFeature({ id: boolId })

  await snapshot('after-target-change')

  return { partId, boolId }
}
