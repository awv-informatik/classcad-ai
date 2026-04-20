// Test with zero-length vectors — does it error?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ZeroVectors' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  console.log('[08] partId:', partId, 'eifId:', eifId, 'boxId:', boxId)

  // Test 1: zero xVec
  const r1 = await api.v1.common.setObjectCoordSystem({
    id: eifId,
    origin: [0, 0, 0],
    xVec: [0, 0, 0],
    yVec: [0, 1, 0],
  })
  console.log('[08] zero xVec result:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages.length > 0) console.log('[08] zero xVec messages:', JSON.stringify(r1.messages))
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'zero-xvec-response')

  // Test 2: zero yVec
  const r2 = await api.v1.common.setObjectCoordSystem({
    id: eifId,
    origin: [0, 0, 0],
    xVec: [1, 0, 0],
    yVec: [0, 0, 0],
  })
  console.log('[08] zero yVec result:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages.length > 0) console.log('[08] zero yVec messages:', JSON.stringify(r2.messages))
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'zero-yvec-response')

  // Test 3: both zero
  const r3 = await api.v1.common.setObjectCoordSystem({
    id: eifId,
    origin: [0, 0, 0],
    xVec: [0, 0, 0],
    yVec: [0, 0, 0],
  })
  console.log('[08] both zero result:', r3.result, 'maxLevel:', r3.maxLevel)
  if (r3.messages.length > 0) console.log('[08] both zero messages:', JSON.stringify(r3.messages))
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'both-zero-response')

  return { partId, eifId, boxId }
}
