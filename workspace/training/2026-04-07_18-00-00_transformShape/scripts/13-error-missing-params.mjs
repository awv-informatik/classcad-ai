// Test: error cases — missing parameters
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MissingParam' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S' })).result
  await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0], endPos: [20, 0, 0] })

  // Missing matrix
  const r1 = await api.v1.curve.transformShape({ id: shapeId })
  console.log('[13] no matrix result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[13] no matrix messages:', JSON.stringify(r1.messages))
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'no-matrix-response')

  // Missing id
  const r2 = await api.v1.curve.transformShape({
    matrix: [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]],
  })
  console.log('[13] no id result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[13] no id messages:', JSON.stringify(r2.messages))
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'no-id-response')

  return { partId }
}
