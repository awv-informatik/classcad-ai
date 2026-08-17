// 10 — Can we delete an entity injection using part.deleteFeature?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DeleteTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'ToDelete' })).result
  console.log('[10] partId:', partId, 'eifId:', eifId)

  // Add a solid so there's content
  const boxId = (await api.v1.solid.box({ id: eifId, length: 50, width: 50, height: 50 })).result
  console.log('[10] boxId:', boxId)

  // Try deleteFeature on the entity injection
  const delR = await api.v1.part.deleteFeature({ id: eifId })
  console.log('[10] deleteFeature result:', delR.result, 'maxLevel:', delR.maxLevel)
  console.log('[10] deleteFeature messages:', JSON.stringify(delR.messages))
  filewrite({ result: delR.result, messages: delR.messages, maxLevel: delR.maxLevel }, 'delete-response')

  // Check if the EI is gone from the structure tree
  const eiNode = delR.structure?.tree?.[eifId]
  console.log('[10] EI node after delete:', eiNode ? 'still exists' : 'GONE')

  return { partId, eifId, boxId }
}
