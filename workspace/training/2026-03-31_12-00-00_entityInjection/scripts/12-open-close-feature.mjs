// 12 — Does openFeature/closeFeature work on entity injections?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'OpenCloseTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'TestEI' })).result
  console.log('[12] eifId:', eifId)

  // Try openFeature on the entity injection
  const openR = await api.v1.part.openFeature({ id: eifId })
  console.log('[12] openFeature result:', openR.result, 'maxLevel:', openR.maxLevel)
  console.log('[12] openFeature messages:', JSON.stringify(openR.messages))
  filewrite({ result: openR.result, messages: openR.messages, maxLevel: openR.maxLevel }, 'open-response')

  // Try closeFeature
  const closeR = await api.v1.part.closeFeature({ id: eifId })
  console.log('[12] closeFeature result:', closeR.result, 'maxLevel:', closeR.maxLevel)
  console.log('[12] closeFeature messages:', JSON.stringify(closeR.messages))
  filewrite({ result: closeR.result, messages: closeR.messages, maxLevel: closeR.maxLevel }, 'close-response')

  return { partId, eifId }
}
