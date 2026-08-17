// Test with non-unit-length vectors — does the server normalize them?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Unnormalized' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 30, height: 20 })).result
  // Reference body
  const sphId = (await api.v1.solid.sphere({ id: eifId, radius: 10, translation: [0, -40, 0] })).result
  console.log('[12] partId:', partId, 'eifId:', eifId, 'boxId:', boxId, 'sphId:', sphId)

  await snapshot('before')

  // Save STEP before
  const stepBefore = (await api.v1.common.save({ format: 'STP', encoding: 'base64' })).result
  filewrite(stepBefore.content, 'step-before')

  // Use very long vectors — [100, 0, 0] and [0, 100, 0] should be equivalent to [1,0,0] [0,1,0]
  const r = await api.v1.common.setObjectCoordSystem({
    id: eifId,
    origin: [0, 0, 0],
    xVec: [100, 0, 0],
    yVec: [0, 100, 0],
  })
  console.log('[12] unnormalized result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages.length > 0) console.log('[12] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'response')

  // Save STEP after
  const stepAfter = (await api.v1.common.save({ format: 'STP', encoding: 'base64' })).result
  filewrite(stepAfter.content, 'step-after')
  console.log('[12] STEP files differ:', stepBefore.content !== stepAfter.content)

  await snapshot('after')

  return { partId, eifId, boxId, sphId }
}
