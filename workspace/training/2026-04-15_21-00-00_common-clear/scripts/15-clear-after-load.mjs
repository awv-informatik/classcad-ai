// 15 — clear after load: save → load → clear → verify clean state
export default async function (api, { filewrite }) {
  // Create and save
  const partId = (await api.v1.part.create({ name: 'SaveLoadClear' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  console.log('[15] created — partId:', partId, 'eifId:', eifId, 'boxId:', boxId)

  const saveR = (await api.v1.common.save({ format: 'OFB' })).result
  console.log('[15] saved — success:', saveR.success, 'content length:', saveR.content?.length)

  // Load back
  const loadR = (await api.v1.common.load({ data: saveR.content, format: 'OFB' })).result
  console.log('[15] loaded — id:', loadR?.id)

  // Clear everything
  const clearR = await api.v1.common.clear({})
  console.log('[15] clear after load — result:', clearR.result, 'maxLevel:', clearR.maxLevel)

  // Can we create fresh?
  const partId2 = (await api.v1.part.create({ name: 'Fresh' })).result
  console.log('[15] partId2 after clear:', partId2)

  // Create new geometry
  const eifId2 = (await api.v1.part.entityInjection({ id: partId2, name: 'EIF2' })).result
  const boxId2 = (await api.v1.solid.box({ id: eifId2, length: 30, width: 30, height: 30 })).result
  console.log('[15] new eifId2:', eifId2, 'boxId2:', boxId2)

  return { partId2 }
}
