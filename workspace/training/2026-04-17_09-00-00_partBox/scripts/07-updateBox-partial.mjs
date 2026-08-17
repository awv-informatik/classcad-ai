export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'PartialUpdateTest' })).result

  const refBox = (await api.v1.part.box({ id: partId, name: 'Reference', length: 20, width: 20, height: 20 })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Target', length: 60, width: 60, height: 60 })).result

  await snapshot('before-partial')

  // Update only height — length and width should keep existing values
  await api.v1.part.openFeature({ id: boxId })
  const ur = await api.v1.part.updateBox({ id: boxId, height: 120 })
  await api.v1.part.closeFeature({ id: boxId })

  console.log('[07] partial update result:', ur.result, 'maxLevel:', ur.maxLevel)
  filewrite({ result: ur.result, messages: ur.messages, maxLevel: ur.maxLevel }, 'partial-update-response')

  await snapshot('after-partial')
  return { partId, boxId }
}
