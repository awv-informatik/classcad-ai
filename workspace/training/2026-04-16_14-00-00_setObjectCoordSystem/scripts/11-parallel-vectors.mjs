// Test with parallel/collinear xVec and yVec — should fail?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ParallelVecs' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  console.log('[11] partId:', partId, 'eifId:', eifId, 'boxId:', boxId)

  // Parallel vectors — same direction
  const r1 = await api.v1.common.setObjectCoordSystem({
    id: eifId,
    origin: [0, 0, 0],
    xVec: [1, 0, 0],
    yVec: [1, 0, 0],
  })
  console.log('[11] parallel same result:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages.length > 0) console.log('[11] parallel same messages:', JSON.stringify(r1.messages))
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'parallel-same')

  // Parallel vectors — opposite direction
  const r2 = await api.v1.common.setObjectCoordSystem({
    id: eifId,
    origin: [0, 0, 0],
    xVec: [1, 0, 0],
    yVec: [-1, 0, 0],
  })
  console.log('[11] parallel opposite result:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages.length > 0) console.log('[11] parallel opposite messages:', JSON.stringify(r2.messages))
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'parallel-opposite')

  return { partId, eifId, boxId }
}
