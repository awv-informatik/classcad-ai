// Test edge case: very small radii, extremely large radii, r1=0 or r2=0
// NOTE: Negative/zero radius hangs the server (like curve.circle). Do NOT test.
// Instead we test: very small, very large, extreme ratio
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'EdgeTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S1' })).result

  // Very small radii
  const r1 = await api.v1.curve.ellipse({ id: shapeId, centerPos: [0, 0, 0], radius1: 0.001, radius2: 0.0005 })
  console.log('[06] tiny radii: result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Very large radii
  const r2 = await api.v1.curve.ellipse({ id: shapeId, centerPos: [5000, 0, 0], radius1: 1000, radius2: 500 })
  console.log('[06] large radii: result:', r2.result, 'maxLevel:', r2.maxLevel)

  // Extreme ratio (very eccentric)
  const r3 = await api.v1.curve.ellipse({ id: shapeId, centerPos: [0, 200, 0], radius1: 100, radius2: 1 })
  console.log('[06] extreme ratio: result:', r3.result, 'maxLevel:', r3.maxLevel)

  await snapshot('edge-cases')
  return { partId }
}
