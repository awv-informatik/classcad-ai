// Q: For movement+angle combos, verify the computed length is geometrically correct
// Use follow-up line segments as visual confirmation of endpoint positions
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({})).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Test: xa=40, a=PI/4 (45°) from (0,0) → expected endpoint: (40, 40)
  // Follow with a line to (80, 40) to visually confirm y=40
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'XaA45' })).result
  const r1 = await api.v1.curve.advancedPolyline({ id: s1, pld: [
    { xa: 0, ya: 0 },
    { xa: 40, a: Math.PI / 4 },   // should end at (40, 40)
    { xa: 80, ya: 40 },           // horizontal → confirms y=40
  ]})
  console.log('[12a] xa+a at 45° → maxLevel:', r1.maxLevel)

  // Test: yr=30, a=PI/3 (60°) from (0,60)
  // At 60°, dx = 30/tan(60°) ≈ 17.32
  // Follow with vertical line to confirm endpoint x position
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'YrA60' })).result
  const r2 = await api.v1.curve.advancedPolyline({ id: s2, pld: [
    { xa: 0, ya: 60 },
    { yr: 30, a: Math.PI / 3 },   // endpoint ≈ (17.32, 90)
    { ya: 60, xr: 0 },            // vertical line down to y=60 from endpoint
  ]})
  console.log('[12b] yr+a at 60° → maxLevel:', r2.maxLevel)

  // Test: xr=20, ar=PI/6 from east direction
  // ar=30° from east = 30° absolute. y = 20*tan(30°) ≈ 11.55
  const s3 = (await api.v1.curve.shape({ id: eifId, name: 'XrAr30' })).result
  const r3 = await api.v1.curve.advancedPolyline({ id: s3, pld: [
    { xa: 0, ya: 120 },
    { l: 10, a: 0 },               // establish east direction
    { xr: 20, ar: Math.PI / 6 },   // 30° from east, move 20 in x → y ≈ 11.55
    { ya: 120, xr: 0 },            // drop back to baseline
  ]})
  console.log('[12c] xr+ar from east → maxLevel:', r3.maxLevel)

  filewrite({
    xaA45: { maxLevel: r1.maxLevel, messages: r1.messages },
    yrA60: { maxLevel: r2.maxLevel, messages: r2.messages },
    xrAr30: { maxLevel: r3.maxLevel, messages: r3.messages },
  }, 'computed-length-results')

  await snapshot('movement-angle-computed')
  return { partId }
}
