// 04b — keepIds: test with careful approach, no snapshot after clear
export default async function (api, { filewrite }) {
  // Create part with geometry
  const partId = (await api.v1.part.create({ name: 'KeepTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  console.log('[04b] partId:', partId, 'eifId:', eifId, 'boxId:', boxId)

  // Clear but keep the part ID
  const r = await api.v1.common.clear({ keepIds: [partId] })
  console.log('[04b] clear keepIds=[partId] — result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'keep-part')

  // Try to read app version — sanity check that server is responsive
  const ver = await api.v1.common.getAppVersion({})
  console.log('[04b] server alive after clear — version:', ver.result)

  // Try to read the kept part's expressions
  const getR = await api.v1.part.getExpression({ id: partId, name: 'CC_BasePart' })
  console.log('[04b] getExpression partId after keep:', getR.result, 'maxLevel:', getR.maxLevel)

  return { partId }
}
