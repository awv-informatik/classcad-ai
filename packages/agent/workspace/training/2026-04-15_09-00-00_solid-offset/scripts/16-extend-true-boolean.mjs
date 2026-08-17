// 16 — extend: TRUE on a boolean solid (box - cylinder)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ExtTrueBool' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  const cylId = (await api.v1.solid.cylinder({ id: eifId, height: 50, diameter: 15, translation: [30, 20, -5] })).result
  await api.v1.solid.subtraction({ id: eifId, target: boxId, tools: [cylId] })

  const refId = (await api.v1.solid.box({ id: eifId, length: 6, width: 6, height: 6, translation: [80, 0, 0] })).result

  await snapshot('before')

  const r = await api.v1.solid.offset({ id: eifId, target: boxId, distance: 3, extend: true })
  console.log('[16] extend=TRUE boolean result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[16] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'ext-true-bool-response')

  await snapshot('after')

  return { boxId, result: r.result }
}
