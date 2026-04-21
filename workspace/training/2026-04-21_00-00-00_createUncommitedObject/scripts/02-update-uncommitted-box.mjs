export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UpdateTest' })).result

  // Create uncommitted box
  const boxId = (await api.v1.part.createUncommitedObject({ id: partId, type: 'CC_Box', name: 'MyBox' })).result
  console.log('[02] uncommitted boxId:', boxId)

  // Try openFeature + updateBox + closeFeature
  const openR = await api.v1.part.openFeature({ id: boxId })
  console.log('[02] openFeature:', openR.result, 'maxLevel:', openR.maxLevel)
  filewrite({ result: openR.result, messages: openR.messages, maxLevel: openR.maxLevel }, 'open-response')

  const updateR = await api.v1.part.updateBox({ id: boxId, length: 60, width: 40, height: 30 })
  console.log('[02] updateBox:', updateR.result, 'maxLevel:', updateR.maxLevel)
  filewrite({ result: updateR.result, messages: updateR.messages, maxLevel: updateR.maxLevel }, 'update-response')

  const closeR = await api.v1.part.closeFeature({ id: boxId })
  console.log('[02] closeFeature:', closeR.result, 'maxLevel:', closeR.maxLevel)
  filewrite({ result: closeR.result, messages: closeR.messages, maxLevel: closeR.maxLevel }, 'close-response')

  // Now check if it has geometry
  await snapshot('after-update')

  // Check structure
  filewrite(closeR.structure, 'structure-after-close')

  // Try getFeature now
  const getR = await api.v1.part.getFeature({ id: partId, name: 'MyBox' })
  console.log('[02] getFeature after close:', getR.result, 'maxLevel:', getR.maxLevel)

  return { partId, boxId }
}
