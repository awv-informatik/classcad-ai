// 07 — Zero distance: edge case
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ZeroOffset' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  console.log('[07] boxId:', boxId)

  const r = await api.v1.solid.offset({ id: eifId, target: boxId, distance: 0 })
  console.log('[07] zero offset result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[07] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'zero-offset-response')

  await snapshot('after-zero')

  return { boxId, result: r.result }
}
