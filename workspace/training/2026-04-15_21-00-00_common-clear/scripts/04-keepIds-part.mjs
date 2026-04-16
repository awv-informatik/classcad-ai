// 04 — keepIds: keep a part during clear
export default async function (api, { snapshot, filewrite }) {
  // Create part with geometry
  const partId = (await api.v1.part.create({ name: 'KeepTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  console.log('[04] partId:', partId, 'eifId:', eifId, 'boxId:', boxId)

  await snapshot('before-keepIds')

  // Clear but keep the part
  const r = await api.v1.common.clear({ keepIds: [partId] })
  console.log('[04] clear keepIds=[partId] — result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[04] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'keep-part-response')

  await snapshot('after-keepIds-part')

  // Check if we can still access the part
  const getR = await api.v1.part.getExpression({ id: partId, name: 'CC_BasePart' })
  console.log('[04] getExpression after keep — result:', getR.result, 'maxLevel:', getR.maxLevel)

  // Try to access the box — was it kept too?
  const copyR = await api.v1.solid.copy({ id: eifId, target: boxId, translation: [80, 0, 0] })
  console.log('[04] copy box after keep — result:', copyR.result, 'maxLevel:', copyR.maxLevel)

  return { partId, boxId }
}
