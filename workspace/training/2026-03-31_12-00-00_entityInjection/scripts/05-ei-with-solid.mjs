// 05 — Use entity injection ID with solid.box to create geometry
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SolidTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'BoxContainer' })).result
  console.log('[05] partId:', partId, 'eifId:', eifId)

  // Create a box inside the entity injection — params are length/width/height, NOT x/y/z
  const boxR = await api.v1.solid.box({ id: eifId, length: 100, width: 60, height: 40 })
  console.log('[05] box result:', boxR.result, 'maxLevel:', boxR.maxLevel)
  filewrite({ result: boxR.result, messages: boxR.messages, maxLevel: boxR.maxLevel }, 'box-response')

  // Check that the EI now has a body in its bodies array
  const eiNode = boxR.structure?.tree?.[eifId]
  console.log('[05] EI bodies:', JSON.stringify(eiNode?.members?.bodies))

  await snapshot('box-in-ei')
  return { partId, eifId, boxId: boxR.result }
}
