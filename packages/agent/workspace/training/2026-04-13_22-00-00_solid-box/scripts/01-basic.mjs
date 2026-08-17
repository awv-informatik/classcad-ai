export default async function (api, { snapshot, filewrite }) {
  // Create part and entity injection feature
  const partId = (await api.v1.part.create({ name: 'BoxTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  console.log('[01] partId:', partId, 'eifId:', eifId)

  // Create a basic box with required params only
  const r = await api.v1.solid.box({ id: eifId, length: 100, width: 60, height: 40 })
  console.log('[01] box result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'box-response')

  await snapshot('basic-box')

  return { partId, eifId, boxId: r.result }
}
