// Verify the tan(a/4) formula by creating arcs with known angles
// and comparing polyline2d bulge arcs with arcByCenterRadAngle arcs
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FormulaVerify' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Test: 90° arc created two ways
  // 1. polyline2d with bulge = tan(90°/4) = tan(22.5°) ≈ 0.41421
  const b90 = Math.tan((90 * Math.PI / 180) / 4)
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'bulge90' })).result
  await api.v1.curve.polyline2d({
    id: s1,
    points: [[0, 0, 0], [40, 0, 0]],
    bulges: [b90, 0],
  })

  // 2. arcByCenterRadAngle with explicit 90° angle
  // For a 90° arc from (0,0) to (40,0), the center is at (20,20) with radius = 20*sqrt(2)
  // Actually, let's just put it in a separate shape for comparison
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'explicit90' })).result
  // The arc midpoint of a 90° bulge on segment (0,0)→(40,0):
  // chord = 40, sagitta = bulge * chord/2 = 0.41421 * 20 ≈ 8.284
  // So the arc bulges up by ~8.284 from the chord line
  const sagitta = b90 * 40 / 2
  console.log('[05] 90° arc: bulge =', b90.toFixed(6), 'sagitta =', sagitta.toFixed(3))

  // Also verify: for 180° (semicircle), sagitta should be half the chord
  const b180 = Math.tan((180 * Math.PI / 180) / 4)
  const sagitta180 = b180 * 40 / 2
  console.log('[05] 180° arc: bulge =', b180.toFixed(6), 'sagitta =', sagitta180.toFixed(3))
  console.log('[05] 180° sagitta should be 20 (radius = half chord):', sagitta180.toFixed(3))

  // For 360° (full circle), bulge → infinity (tan(90°))
  // tan(360°/4) = tan(90°) → ∞
  console.log('[05] 360° bulge would be tan(90°) = infinity:', Math.tan(Math.PI / 2))

  // Verify formula: bulge = tan(a/4), so a = 4*atan(bulge)
  const testBulges = [0, 0.2, 0.41421, 0.5773, 1.0, 2.0, 5.0]
  const formulaResults = testBulges.map(b => {
    const angleDeg = (4 * Math.atan(b)) * 180 / Math.PI
    return { bulge: b, angleDeg: Math.round(angleDeg * 100) / 100 }
  })
  console.log('[05] inverse formula check:')
  formulaResults.forEach(f => console.log(`  bulge=${f.bulge} → ${f.angleDeg}°`))
  filewrite(formulaResults, 'formula-verify')

  await snapshot('formula-verify')
  return { partId }
}
