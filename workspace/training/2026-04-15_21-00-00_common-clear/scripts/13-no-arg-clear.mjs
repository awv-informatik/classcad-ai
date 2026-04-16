// 13 — clear() with no arguments at all vs clear({})
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NoArg' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  console.log('[13] setup — partId:', partId, 'eifId:', eifId, 'boxId:', boxId)

  // Clear with no args (the docs show api.v1.common.clear())
  const r = await api.v1.common.clear()
  console.log('[13] clear() no args — result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[13] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'clear-noarg')

  // Can we create after?
  const partId2 = (await api.v1.part.create({ name: 'After' })).result
  console.log('[13] partId after clear():', partId2)

  return { partId2 }
}
