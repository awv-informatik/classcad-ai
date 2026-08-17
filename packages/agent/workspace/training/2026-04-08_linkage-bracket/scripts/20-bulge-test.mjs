// 20 — Quick test: which bulge sign gives outward arcs?
// Create a unit square with quarter-circle corners using polyline2d
const IN = 25.4

export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'BulgeTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'BT' })).result

  // Circle approximation: 4 points at 0°, 90°, 180°, 270° on a R=20mm circle
  // With bulge = tan(90°/4) = 0.414 for each segment → should make a circle
  const R = 20
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'Positive' })).result
  await api.v1.curve.polyline2d({
    id: s1,
    points: [[R,0,0], [0,R,0], [-R,0,0], [0,-R,0]],
    bulges: [0.414, 0.414, 0.414, 0.414],
    close: true
  })

  // Same but negative bulges
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'Negative' })).result
  await api.v1.curve.polyline2d({
    id: s2,
    points: [[R+50,0,0], [50,R,0], [-R+50,0,0], [50,-R,0]],  // offset by 50 to separate
    bulges: [-0.414, -0.414, -0.414, -0.414],
    close: true
  })

  // Simple stadium for reference (known working from earlier)
  const s3 = (await api.v1.curve.shape({ id: eifId, name: 'StadiumRef' })).result
  await api.v1.curve.polyline2d({
    id: s3,
    points: [[100,-15,0], [120,-15,0], [120,15,0], [100,15,0]],
    bulges: [0, -1, 0, -1],
    close: true
  })

  await snapshot('bulge-test')
  console.log('[20] Left: positive bulges. Center: negative bulges. Right: stadium with -1 bulges.')
}
