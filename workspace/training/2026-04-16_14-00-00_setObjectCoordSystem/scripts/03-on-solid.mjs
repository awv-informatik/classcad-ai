// Test setObjectCoordSystem directly on a solid body
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CoordSysSolid' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  // Add a reference sphere to detect if only the box moves
  const sphId = (await api.v1.solid.sphere({ id: eifId, radius: 10, translation: [-30, 0, 0] })).result
  console.log('[03] partId:', partId, 'eifId:', eifId, 'boxId:', boxId, 'sphId:', sphId)

  await snapshot('before')

  // Set coord system on the solid body itself
  const r = await api.v1.common.setObjectCoordSystem({
    id: boxId,
    origin: [100, 100, 0],
    xVec: [1, 0, 0],
    yVec: [0, 1, 0],
  })
  console.log('[03] setObjectCoordSystem on solid result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages.length > 0) console.log('[03] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'solid-response')

  await snapshot('after-solid')

  return { partId, eifId, boxId, sphId }
}
