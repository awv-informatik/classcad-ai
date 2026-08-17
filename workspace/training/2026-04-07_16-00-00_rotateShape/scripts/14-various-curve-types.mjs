// 14 — Rotate a shape with various curve types (line, circle, arc, polyline)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CurveTypesTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Mixed' })).result

  // Add various curve types
  await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0], endPos: [30, 0, 0] })
  await api.v1.curve.circle({ id: shapeId, centerPos: [15, 15, 0], radius: 8 })
  await api.v1.curve.advancedPolyline({
    id: shapeId,
    pld: [
      { xa: 0, ya: 30 },
      { xa: 10, ya: 30, r: 3 },
      { xa: 10, ya: 40 },
      { xa: 0, ya: 40 },
    ],
    close: true,
  })

  // Rotate 60° around Z
  const r = await api.v1.curve.rotateShape({ id: shapeId, rotation: [0, 0, Math.PI / 3] })
  console.log('[14] mixed curves rotation — result:', r.result, 'maxLevel:', r.maxLevel)

  await snapshot('mixed-curves-rotated')

  return { partId }
}
