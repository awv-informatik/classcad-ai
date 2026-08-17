// 01 — basic clear: create geometry, clear, verify empty
export default async function (api, { snapshot, filewrite }) {
  // Create a part with a box
  const partId = (await api.v1.part.create({ name: 'ClearTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  console.log('[01] partId:', partId, 'eifId:', eifId, 'boxId:', boxId)

  await snapshot('before-clear')

  // Call clear with empty params
  const clearR = await api.v1.common.clear({})
  console.log('[01] clear result:', clearR.result)
  console.log('[01] clear maxLevel:', clearR.maxLevel)
  console.log('[01] clear messages:', JSON.stringify(clearR.messages))

  filewrite({ result: clearR.result, messages: clearR.messages, maxLevel: clearR.maxLevel }, 'clear-response')

  await snapshot('after-clear')

  return { partId, clearResult: clearR.result }
}
