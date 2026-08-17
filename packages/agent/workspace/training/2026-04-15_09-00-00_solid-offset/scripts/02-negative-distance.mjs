// 02 — Negative distance: offset inward
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NegOffset' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  // Create a box and a reference body (small cylinder that won't change)
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  const refId = (await api.v1.solid.cylinder({ id: eifId, height: 10, diameter: 8, translation: [80, 0, 0] })).result
  console.log('[02] boxId:', boxId, 'refId:', refId)

  await snapshot('before')

  // Offset inward by -5
  const r = await api.v1.solid.offset({ id: eifId, target: boxId, distance: -5 })
  console.log('[02] negative offset result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[02] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'neg-offset-response')

  await snapshot('after')

  return { boxId, offsetResult: r.result }
}
