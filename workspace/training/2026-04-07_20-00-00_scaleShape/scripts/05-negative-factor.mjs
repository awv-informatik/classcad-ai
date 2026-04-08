// Test scaleShape with negative factor — does it mirror or error?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NegFactor' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Tri' })).result

  // Asymmetric triangle so mirroring is visible
  await api.v1.curve.line({ id: shapeId, startPos: [10, 0, 0], endPos: [40, 0, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [40, 0, 0], endPos: [20, 30, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [20, 30, 0], endPos: [10, 0, 0] })

  await snapshot('before-neg')

  const r = await api.v1.curve.scaleShape({ id: shapeId, factor: -1.0 })
  console.log('[05] scaleShape -1.0 result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[05] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'neg-factor-response')

  await snapshot('after-neg')
  filewrite(r.graphic, 'neg-factor-graphic')

  return { partId }
}
