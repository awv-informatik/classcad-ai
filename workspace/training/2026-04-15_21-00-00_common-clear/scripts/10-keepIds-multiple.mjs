// 10 — keepIds: keep multiple IDs (part + eif)
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Multi' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  const cylId = (await api.v1.solid.cylinder({ id: eifId, height: 40, diameter: 20, translation: [80, 0, 0] })).result
  console.log('[10] partId:', partId, 'eifId:', eifId, 'boxId:', boxId, 'cylId:', cylId)

  // Keep both the part and the entity injection
  const r = await api.v1.common.clear({ keepIds: [partId, eifId] })
  console.log('[10] keepIds=[partId, eifId] — result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[10] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'keep-multi')

  // Can we still create a box in the kept eifId?
  const boxR = await api.v1.solid.box({ id: eifId, length: 30, width: 30, height: 30 })
  console.log('[10] new box in old eifId — result:', boxR.result, 'maxLevel:', boxR.maxLevel)

  // Can we copy the old box?
  if (boxR.result) {
    const copyR = await api.v1.solid.copy({ id: eifId, target: boxId, translation: [0, 80, 0] })
    console.log('[10] copy old box — result:', copyR.result, 'maxLevel:', copyR.maxLevel)
  }

  return {}
}
