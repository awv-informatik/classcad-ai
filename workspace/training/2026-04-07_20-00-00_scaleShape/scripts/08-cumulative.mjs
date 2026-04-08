// Test cumulative scaling — two calls of factor 2 should equal one call of factor 4
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Cumulative' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Rect' })).result

  // Rectangle from (10,10) to (20,20) — known starting coordinates
  await api.v1.curve.line({ id: shapeId, startPos: [10, 10, 0], endPos: [20, 10, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [20, 10, 0], endPos: [20, 20, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [20, 20, 0], endPos: [10, 20, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [10, 20, 0], endPos: [10, 10, 0] })

  // First scale: 2x
  const r1 = await api.v1.curve.scaleShape({ id: shapeId, factor: 2.0 })
  console.log('[08] first scale 2x:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite(r1.graphic, 'after-first-scale-graphic')

  // Second scale: 2x (cumulative = 4x total)
  const r2 = await api.v1.curve.scaleShape({ id: shapeId, factor: 2.0 })
  console.log('[08] second scale 2x:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite(r2.graphic, 'after-second-scale-graphic')

  await snapshot('after-cumulative-4x')

  // Expected: rect from (40,40) to (80,80) if scale center is origin
  // Or rect from proportional coords if scale center is shape center

  return { partId }
}
