// Test with non-orthogonal xVec and yVec — what happens?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NonOrthogonal' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  console.log('[07] partId:', partId, 'eifId:', eifId, 'boxId:', boxId)

  await snapshot('before')

  // Non-orthogonal vectors: xVec and yVec at 45 degrees
  const r = await api.v1.common.setObjectCoordSystem({
    id: eifId,
    origin: [0, 0, 0],
    xVec: [1, 0, 0],
    yVec: [1, 1, 0],  // not perpendicular to xVec
  })
  console.log('[07] non-orthogonal result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages.length > 0) console.log('[07] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'non-orthogonal-response')

  await snapshot('after-non-orthogonal')

  return { partId, eifId, boxId }
}
