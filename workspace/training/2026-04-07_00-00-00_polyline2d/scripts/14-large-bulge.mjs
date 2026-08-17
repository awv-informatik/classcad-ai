// Edge case: very large bulge values (> 1) — what happens?
// bulge = tan(a/4). For a > π (> 180°), bulge > tan(π/4) = 1
// bulge = 2 → a = 4*atan(2) ≈ 4.43 rad ≈ 253.7°
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'LargeBulge' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'BigBulge' })).result

  const r = await api.v1.curve.polyline2d({
    id: shapeId,
    points: [
      [0, 0, 0],
      [40, 0, 0],
      [80, 0, 0],
    ],
    bulges: [2, -2, 0], // large bulge → > 180° arcs
  })

  console.log('[14] large bulge result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[14] bulge=2 → angle:', 4 * Math.atan(2), 'rad →', (4 * Math.atan(2) * 180) / Math.PI, 'deg')
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'large-bulge-response')

  await snapshot('large-bulge')
  return { partId }
}
