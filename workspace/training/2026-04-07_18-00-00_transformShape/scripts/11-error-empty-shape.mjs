// Test: error case — empty shape (no curves)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'EmptyShape' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S' })).result

  // Don't add any curves — shape is empty
  const r = await api.v1.curve.transformShape({
    id: shapeId,
    matrix: [
      [1, 0, 0, 10],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ],
  })

  console.log('[11] empty shape result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[11] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'empty-shape-response')

  return { partId, shapeId }
}
