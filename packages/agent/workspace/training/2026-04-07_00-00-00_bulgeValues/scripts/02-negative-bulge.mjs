// Test negative bulge = clockwise arc direction
// Compare positive vs negative bulge of same magnitude
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NegBulge' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const b90 = Math.tan(Math.PI / 8) // ≈ 0.41421 → 90° arc

  // Shape 1: positive bulge (counterclockwise)
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'CCW' })).result
  const r1 = await api.v1.curve.polyline2d({
    id: s1,
    points: [[0, 0, 0], [40, 0, 0]],
    bulges: [b90, 0],
  })

  // Shape 2: negative bulge (clockwise)
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'CW' })).result
  const r2 = await api.v1.curve.polyline2d({
    id: s2,
    points: [[0, -50, 0], [40, -50, 0]],
    bulges: [-b90, 0],
  })

  console.log('[02] positive bulge:', r1.maxLevel, '| negative bulge:', r2.maxLevel)

  // Dump graphic data to compare arc geometry
  filewrite(r1.graphic, 'ccw-graphic')
  filewrite(r2.graphic, 'cw-graphic')

  await snapshot('pos-vs-neg-bulge')
  return { partId }
}
