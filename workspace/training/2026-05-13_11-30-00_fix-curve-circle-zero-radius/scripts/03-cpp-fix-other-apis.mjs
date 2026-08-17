// Verify the C++ CurveBuilder fix protects unguarded API paths too.
// `arcByCenterRadAngle`, `ellipticArc`, `ellipse` route through the same
// CADH_CreateEllipticArc → CurveBuilder::CreateEllipse (8-arg) call.
// Before the C++ fix: each hangs. After: cclass returns cleanly (possibly empty result).
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BroadFix' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'X' })).result

  const withTimeout = (p, ms, label) =>
    Promise.race([
      p,
      new Promise((_, rej) => setTimeout(() => rej(new Error(`timeout ${ms}ms: ${label}`)), ms)),
    ])

  const results = {}

  const cases = [
    ['arcByCenterRadAngle r=0', () => api.v1.curve.arcByCenterRadAngle({ id: shapeId, centerPos: [0,0,0], startAngle: 0, endAngle: 1.57, radius: 0 })],
    ['arcByCenterRadAngle r=-3', () => api.v1.curve.arcByCenterRadAngle({ id: shapeId, centerPos: [0,0,0], startAngle: 0, endAngle: 1.57, radius: -3 })],
    ['ellipticArc r1=0 r2=5', () => api.v1.curve.ellipticArc({ id: shapeId, centerPos: [0,0,0], startAngle: 0, endAngle: 1.57, radius1: 0, radius2: 5 })],
    ['ellipticArc r1=5 r2=0', () => api.v1.curve.ellipticArc({ id: shapeId, centerPos: [0,0,0], startAngle: 0, endAngle: 1.57, radius1: 5, radius2: 0 })],
    ['ellipse r1=0 r2=0', () => api.v1.curve.ellipse({ id: shapeId, centerPos: [0,0,0], radius1: 0, radius2: 0 })],
    ['ellipse r1=-2 r2=3', () => api.v1.curve.ellipse({ id: shapeId, centerPos: [0,0,0], radius1: -2, radius2: 3 })],
  ]

  for (const [label, fn] of cases) {
    console.log(`[bcr] ${label}...`)
    try {
      const r = await withTimeout(fn(), 8000, label)
      console.log(`  → maxLevel=${r.maxLevel} messages=${JSON.stringify(r.messages)}`)
      results[label] = { maxLevel: r.maxLevel, messages: r.messages }
    } catch (e) {
      console.error(`  → FAILED: ${e.message}`)
      results[label] = { error: e.message }
    }
  }

  // Sanity: valid call still produces geometry
  const ok = await api.v1.curve.circle({ id: shapeId, centerPos: [0,0,0], radius: 10 })
  console.log('[bcr] valid circle r=10:', ok.maxLevel)
  results['valid-circle'] = { maxLevel: ok.maxLevel, messages: ok.messages }

  filewrite(results, 'cpp-fix-results')
  return results
}
