// 08 — keepIds: try keeping solid IDs directly (not part or eif)
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'KeepSolid' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  const cylId = (await api.v1.solid.cylinder({ id: eifId, height: 40, diameter: 20, translation: [80, 0, 0] })).result
  console.log('[08] partId:', partId, 'eifId:', eifId, 'boxId:', boxId, 'cylId:', cylId)

  // Try keeping just the box solid
  const r = await api.v1.common.clear({ keepIds: [boxId] })
  console.log('[08] keepIds=[boxId] — result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[08] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'keep-solid')

  // Server alive?
  const ver = await api.v1.common.getAppVersion({})
  console.log('[08] server alive:', ver.result ? 'yes' : 'yes (empty version)')

  // Can we create a new part?
  const newPart = await api.v1.part.create({ name: 'After' })
  console.log('[08] new partId:', newPart.result, 'maxLevel:', newPart.maxLevel)

  return {}
}
