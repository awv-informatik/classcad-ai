// Test with invalid/nonexistent ID
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'InvalidId' })).result
  console.log('[16] partId:', partId)

  // Nonexistent ID
  const r1 = await api.v1.common.setObjectCoordSystem({
    id: 99999,
    origin: [0, 0, 0],
    xVec: [1, 0, 0],
    yVec: [0, 1, 0],
  })
  console.log('[16] invalid id result:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages.length > 0) console.log('[16] messages:', JSON.stringify(r1.messages))
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'invalid-id')

  // ID=0
  const r2 = await api.v1.common.setObjectCoordSystem({
    id: 0,
    origin: [0, 0, 0],
    xVec: [1, 0, 0],
    yVec: [0, 1, 0],
  })
  console.log('[16] id=0 result:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages.length > 0) console.log('[16] id=0 messages:', JSON.stringify(r2.messages))
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'id-zero')

  return { partId }
}
