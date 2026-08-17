// 09 — keepIds: keep entity injection ID, check if children survive
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'KeepEIF' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  console.log('[09] partId:', partId, 'eifId:', eifId, 'boxId:', boxId)

  // Keep the entity injection feature
  const r = await api.v1.common.clear({ keepIds: [eifId] })
  console.log('[09] clear keepIds=[eifId] — result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[09] messages:', JSON.stringify(r.messages))

  // Check server alive
  const ver = await api.v1.common.getAppVersion({})
  console.log('[09] server alive:', typeof ver.result)

  // Can we create a new part?
  const partId2 = (await api.v1.part.create({ name: 'After' })).result
  console.log('[09] new partId2:', partId2)

  // Can we use old eifId?
  if (partId2) {
    const boxR = await api.v1.solid.box({ id: eifId, length: 30, width: 30, height: 30 })
    console.log('[09] box in old eifId — result:', boxR.result, 'maxLevel:', boxR.maxLevel)
  }

  return { partId2 }
}
