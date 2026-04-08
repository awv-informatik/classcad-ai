// Test basic scaleShape with factor > 1 (scale up by 2x)
// Verify: return value, maxLevel, coordinate changes via filewrite
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ScaleTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Rect' })).result

  // Create a rectangle at known coordinates
  await api.v1.curve.line({ id: shapeId, startPos: [10, 10, 0], endPos: [30, 10, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [30, 10, 0], endPos: [30, 20, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [30, 20, 0], endPos: [10, 20, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [10, 20, 0], endPos: [10, 10, 0] })

  await snapshot('before-scale')

  // Scale by factor 2
  const r = await api.v1.curve.scaleShape({ id: shapeId, factor: 2.0 })
  console.log('[01] scaleShape result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'scale-response')

  await snapshot('after-scale-2x')

  // Dump graphic data for coordinate verification
  filewrite(r.graphic, 'after-scale-graphic')

  return { partId }
}
