// Diagnostic: dump graphic/structure after each arc to see what's persisted
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S1' })).result

  // Arc 1 — quarter arc at origin
  const r1 = await api.v1.curve.ellipticArc({
    id: shapeId, centerPos: [0, 0, 0],
    startAngle: 0, endAngle: Math.PI / 2, radius1: 30, radius2: 15,
  })
  console.log('[04] arc1 maxLevel:', r1.maxLevel)
  filewrite(r1.graphic, 'after-arc1-graphic')

  // Arc 2 — half arc offset
  const r2 = await api.v1.curve.ellipticArc({
    id: shapeId, centerPos: [80, 0, 0],
    startAngle: 0, endAngle: Math.PI, radius1: 20, radius2: 10,
  })
  console.log('[04] arc2 maxLevel:', r2.maxLevel)
  filewrite(r2.graphic, 'after-arc2-graphic')

  // Also add a line for comparison
  const r3 = await api.v1.curve.line({
    id: shapeId, startPos: [0, -20, 0], endPos: [80, -20, 0],
  })
  console.log('[04] line maxLevel:', r3.maxLevel)
  filewrite(r3.graphic, 'after-line-graphic')

  await snapshot('diagnostic')
  return { partId }
}
