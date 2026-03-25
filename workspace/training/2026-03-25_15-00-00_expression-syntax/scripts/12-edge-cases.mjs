// Edge cases: very large, very small, negative, zero
export default async function (api) {
  const tests = [
    ['1e10', null],
    ['1e-10', null],
    ['1e100', null],
    ['0.000001', null],
    ['-0', null],
    ['--5', null],            // double negative
    ['-(5)', null],
    ['(-5) * (-3)', 15],
    ['1/0', null],            // division by zero
    ['0/0', null],
    ['sqrt(-1)', null],       // imaginary
    ['ln(-1)', null],
    ['asin(2)', null],        // out of domain
    ['acos(2)', null],
    ['pow(0, 0)', null],      // 0^0
    ['pow(0, -1)', null],     // 1/0
  ]

  for (const [expr, expected] of tests) {
    const r = await api.v1.common.evaluateExpression({ expression: expr, silent: true })
    const ok = expected !== null ? (Math.abs(r.result - expected) < 1e-10 ? '✓' : '❌') : '?'
    console.log(`[12] ${ok} '${expr}' = ${r.result} maxLevel:${r.maxLevel}${expected !== null ? ` (expected ${expected})` : ''}`)
  }

  return {}
}
