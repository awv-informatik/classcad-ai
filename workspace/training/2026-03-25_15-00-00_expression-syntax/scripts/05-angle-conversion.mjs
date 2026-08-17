// Angle conversion functions: a_r (degrees→radians), r_a (radians→degrees)
export default async function (api) {
  const PI = Math.PI
  const tests = [
    ['a_r(180)', PI],
    ['a_r(90)', PI/2],
    ['a_r(45)', PI/4],
    ['a_r(360)', 2*PI],
    ['a_r(0)', 0],
    ['r_a(C:PI)', 180],
    ['r_a(C:PI/2)', 90],
    ['r_a(1)', null],         // ~57.2958 degrees
    ['r_a(0)', 0],
    // Round-trip
    ['r_a(a_r(45))', 45],
    ['a_r(r_a(1))', 1],
    // Practical: sin of 45 degrees
    ['sin(a_r(45))', Math.sin(PI/4)],
    ['cos(a_r(60))', 0.5],
  ]

  for (const [expr, expected] of tests) {
    const r = await api.v1.common.evaluateExpression({ expression: expr })
    const ok = expected !== null ? (Math.abs(r.result - expected) < 1e-6 ? '✓' : '❌') : '?'
    console.log(`[05] ${ok} '${expr}' = ${r.result}${expected !== null ? ` (expected ~${expected.toFixed(6)})` : ''} maxLevel:${r.maxLevel}`)
  }

  return {}
}
