// Test scaleShape with precise fractional factor (1/3) — verify precision
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Precise' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Tri' })).result

  // Simple triangle with known coords
  await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0], endPos: [30, 0, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [30, 0, 0], endPos: [15, 30, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [15, 30, 0], endPos: [0, 0, 0] })

  // Scale by 1/3
  const r = await api.v1.curve.scaleShape({ id: shapeId, factor: 1/3 })
  console.log('[19] scaleShape 1/3 result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite(r.graphic, 'precise-scale-graphic')

  await snapshot('after-third-scale')

  // Expected: (0,0)→(10,0), (10,0)→(5,10), (5,10)→(0,0)

  return { partId }
}
