// 11 — Delete entity injection with correct deleteFeature({ ids: [...] })
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DeleteTest2' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'ToDelete' })).result
  console.log('[11] eifId:', eifId)

  // Add a solid
  const boxId = (await api.v1.solid.box({ id: eifId, length: 50, width: 50, height: 50 })).result
  console.log('[11] boxId:', boxId)

  // Delete using ids array
  const delR = await api.v1.part.deleteFeature({ ids: [eifId] })
  console.log('[11] delete result:', delR.result, 'maxLevel:', delR.maxLevel)
  console.log('[11] delete messages:', JSON.stringify(delR.messages))
  filewrite({ result: delR.result, messages: delR.messages, maxLevel: delR.maxLevel }, 'delete-v2-response')

  // Check structure tree — is EI gone?
  const eiNode = delR.structure?.tree?.[eifId]
  const boxNode = delR.structure?.tree?.[boxId]
  console.log('[11] EI after delete:', eiNode ? 'EXISTS' : 'GONE')
  console.log('[11] Box after delete:', boxNode ? 'EXISTS' : 'GONE')

  return { partId, eifId, boxId }
}
