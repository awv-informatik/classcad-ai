// Test translateShape with `ids` (array) instead of `id` (singular)
// The error from 01 said parameter "ids" — docs say "id"
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TranslateTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Rect' })).result

  // Create a simple rectangle at origin
  await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0], endPos: [20, 0, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [20, 0, 0], endPos: [20, 10, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [20, 10, 0], endPos: [0, 10, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [0, 10, 0], endPos: [0, 0, 0] })

  await snapshot('before-translate')

  // Try with ids (array) instead of id
  const r = await api.v1.curve.translateShape({ ids: [shapeId], translation: [50, 0, 0] })
  console.log('[02] translateShape result:', r.result)
  console.log('[02] maxLevel:', r.maxLevel)
  console.log('[02] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'translate-ids-response')

  await snapshot('after-translate-ids')

  return { partId, shapeId }
}
