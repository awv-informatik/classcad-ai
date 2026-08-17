// 17 — mixed keepIds: one valid + one invalid — does it abort?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Mixed' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  console.log('[17] partId:', partId, 'eifId:', eifId, 'boxId:', boxId)

  // Clear with mix of valid (partId) and invalid (999999)
  const r = await api.v1.common.clear({ keepIds: [partId, 999999] })
  console.log('[17] keepIds=[partId, 999999] — result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[17] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'mixed-keepids')

  // Did the clear happen? Try part.create to find out
  const partR = await api.v1.part.create({ name: 'After' })
  console.log('[17] part.create — result:', partR.result, 'maxLevel:', partR.maxLevel)
  if (partR.result === null) {
    console.log('[17] part.create messages:', JSON.stringify(partR.messages))
    console.log('[17] CLEAR ABORTED — drawing still has part')

    // Check if the kept part's eif is still accessible
    const newBox = await api.v1.solid.box({ id: eifId, length: 20, width: 20, height: 20, translation: [80, 0, 0] })
    console.log('[17] box in old eif — result:', newBox.result, 'maxLevel:', newBox.maxLevel)
  } else {
    console.log('[17] CLEAR SUCCEEDED (partially?) — new part created')
  }

  return {}
}
