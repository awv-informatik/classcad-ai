// Test scaleShape with missing parameters
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MissingParams' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Rect' })).result
  await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0], endPos: [10, 0, 0] })

  // Missing factor
  const r1 = await api.v1.curve.scaleShape({ id: shapeId })
  console.log('[13] missing factor result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[13] missing factor messages:', JSON.stringify(r1.messages))
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'missing-factor-response')

  // Missing id
  const r2 = await api.v1.curve.scaleShape({ factor: 2.0 })
  console.log('[13] missing id result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[13] missing id messages:', JSON.stringify(r2.messages))
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'missing-id-response')

  // Empty object
  const r3 = await api.v1.curve.scaleShape({})
  console.log('[13] empty obj result:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[13] empty obj messages:', JSON.stringify(r3.messages))
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'empty-obj-response')

  return { partId }
}
