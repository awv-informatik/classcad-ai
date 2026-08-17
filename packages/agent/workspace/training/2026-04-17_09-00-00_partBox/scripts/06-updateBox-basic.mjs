export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UpdateBoxTest' })).result

  // Create a reference box that won't change (to detect auto-scaling)
  const refBox = (await api.v1.part.box({ id: partId, name: 'Reference', length: 20, width: 20, height: 20 })).result

  // Create the box to update
  const boxId = (await api.v1.part.box({ id: partId, name: 'Target', length: 60, width: 40, height: 30 })).result
  console.log('[06] boxId:', boxId)

  await snapshot('before-update')

  // Open → update → close
  await api.v1.part.openFeature({ id: boxId })
  const ur = await api.v1.part.updateBox({ id: boxId, length: 120, width: 80, height: 60 })
  await api.v1.part.closeFeature({ id: boxId })

  console.log('[06] updateBox result:', ur.result, 'maxLevel:', ur.maxLevel)
  filewrite({ result: ur.result, messages: ur.messages, maxLevel: ur.maxLevel }, 'updateBox-response')

  await snapshot('after-update')
  return { partId, boxId, refBox }
}
