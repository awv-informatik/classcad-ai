// 14 — clear with keepIds: [] (empty array)
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'EmptyKeep' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  console.log('[14] setup — partId:', partId, 'eifId:', eifId, 'boxId:', boxId)

  // Clear with empty keepIds array
  const r = await api.v1.common.clear({ keepIds: [] })
  console.log('[14] clear keepIds=[] — result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[14] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'clear-empty-keepids')

  // Can we create after?
  const partId2 = (await api.v1.part.create({ name: 'After' })).result
  console.log('[14] partId after:', partId2)

  return { partId2 }
}
