// 10 — extend: TRUE with negative distance on a box (should shrink cleanly, sharp edges)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ExtNeg' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  const refId = (await api.v1.solid.cylinder({ id: eifId, height: 10, diameter: 8, translation: [80, 0, 0] })).result
  console.log('[10] boxId:', boxId, 'refId:', refId)

  await snapshot('before')

  const r = await api.v1.solid.offset({ id: eifId, target: boxId, distance: -5, extend: true })
  console.log('[10] extend=TRUE neg result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[10] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'ext-neg-response')

  await snapshot('after')

  return { boxId, result: r.result }
}
