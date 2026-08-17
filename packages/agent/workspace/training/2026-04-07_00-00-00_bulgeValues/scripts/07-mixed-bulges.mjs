// Test: mixed bulges in a single polyline — some straight, some arc, positive/negative
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MixedBulges' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const b90 = Math.tan(Math.PI / 8)

  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'mixed' })).result
  const r1 = await api.v1.curve.polyline2d({
    id: s1,
    points: [
      [0, 0, 0],
      [30, 0, 0],    // straight →
      [60, 0, 0],    // 90° CCW arc →
      [60, 30, 0],   // straight ↑
      [60, 60, 0],   // 90° CW arc ↑
      [30, 60, 0],   // straight ←
    ],
    bulges: [0, b90, 0, -b90, 0, 0],
    close: true,
  })
  console.log('[07] mixed bulges:', r1.maxLevel)
  filewrite(r1.graphic, 'mixed-graphic')

  // Also: the docs example from the API
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'docsExample' })).result
  const r2 = await api.v1.curve.polyline2d({
    id: s2,
    points: [
      [0, -50, 0],
      [10, -50, 0],
      [10, -40, 0],
      [0, -40, 0],
      [0, -50, 0],
    ],
    bulges: [0.3, -0.3, 0.3, -0.3, 0],
  })
  console.log('[07] docs example:', r2.maxLevel)
  // What angle does bulge=0.3 correspond to?
  const angleDeg = (4 * Math.atan(0.3)) * 180 / Math.PI
  console.log('[07] bulge=0.3 → angle:', angleDeg.toFixed(2), '°')

  await snapshot('mixed-bulges')
  return { partId }
}
