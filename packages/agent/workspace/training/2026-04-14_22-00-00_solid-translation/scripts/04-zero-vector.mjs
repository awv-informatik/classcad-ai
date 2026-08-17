// 04 — Zero vector translation: [0,0,0]
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ZeroVec' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const boxId = (await api.v1.solid.box({ id: eifId, length: 50, width: 50, height: 50 })).result

  const r = await api.v1.solid.translation({ id: eifId, target: boxId, translation: [0, 0, 0] })
  console.log('[04] zero-vec result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[04] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'zero-vec-response')

  return { boxId, result: r.result }
}
