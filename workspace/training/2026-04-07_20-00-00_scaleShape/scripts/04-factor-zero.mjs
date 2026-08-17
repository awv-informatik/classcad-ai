// Test scaleShape with factor = 0 (edge case — degenerate geometry or error?)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FactorZero' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Rect' })).result

  await api.v1.curve.line({ id: shapeId, startPos: [10, 10, 0], endPos: [30, 10, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [30, 10, 0], endPos: [30, 20, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [30, 20, 0], endPos: [10, 20, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [10, 20, 0], endPos: [10, 10, 0] })

  const r = await api.v1.curve.scaleShape({ id: shapeId, factor: 0 })
  console.log('[04] scaleShape 0 result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[04] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'factor-zero-response')

  // Try snapshot — may fail or produce empty
  try {
    await snapshot('after-factor-zero')
  } catch (e) {
    console.log('[04] snapshot error:', e.message)
  }

  return { partId }
}
