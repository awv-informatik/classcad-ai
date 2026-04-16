// 05 — keepIds: try keeping individual features (entity injection, box)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'KeepFeature' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  const cylId = (await api.v1.solid.cylinder({ id: eifId, height: 40, diameter: 20, translation: [80, 0, 0] })).result
  console.log('[05] partId:', partId, 'eifId:', eifId, 'boxId:', boxId, 'cylId:', cylId)

  await snapshot('before')

  // Try keeping just the entity injection feature
  const r = await api.v1.common.clear({ keepIds: [eifId] })
  console.log('[05] clear keepIds=[eifId] — result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[05] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'keep-eif-response')

  await snapshot('after-keep-eif')

  // Check what survived
  const copyBox = await api.v1.solid.copy({ id: eifId, target: boxId, translation: [0, 80, 0] })
  console.log('[05] copy box after keep eif — result:', copyBox.result, 'maxLevel:', copyBox.maxLevel)

  const copyCyl = await api.v1.solid.copy({ id: eifId, target: cylId, translation: [0, 80, 0] })
  console.log('[05] copy cyl after keep eif — result:', copyCyl.result, 'maxLevel:', copyCyl.maxLevel)

  return { partId }
}
