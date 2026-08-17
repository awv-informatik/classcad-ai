// Test setObjectCoordSystem on an entity injection feature
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CoordSysEIF' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  console.log('[02] partId:', partId, 'eifId:', eifId, 'boxId:', boxId)

  await snapshot('before')

  // Set coord system on the entity injection feature
  const r = await api.v1.common.setObjectCoordSystem({
    id: eifId,
    origin: [100, 0, 0],
    xVec: [1, 0, 0],
    yVec: [0, 1, 0],
  })
  console.log('[02] setObjectCoordSystem on EIF result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages.length > 0) console.log('[02] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'eif-response')

  await snapshot('after-eif')

  return { partId, eifId, boxId }
}
