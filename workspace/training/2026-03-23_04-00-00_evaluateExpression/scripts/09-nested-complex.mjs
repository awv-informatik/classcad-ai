// Nested/complex expressions and edge cases
export default async function (api) {
  const tests = [
    ['sin(C:PI/4) * sqrt(2)', 1],            // sin(45°)*√2 = 1
    ['pow(sin(C:PI/6), 2) + pow(cos(C:PI/6), 2)', 1],  // sin²+cos²=1
    ['max(abs(-5), min(3, 7))', 5],
    ['fmod(pow(2, 10), 100)', 24],            // 1024 mod 100 = 24
    ['a_r(r_a(C:PI))', Math.PI],              // round-trip
    ['ln(pow(exp(1), 3))', 3],                // ln(e³) = 3
  ]
  for (const [expr, expected] of tests) {
    const r = await api.v1.common.evaluateExpression({ expression: expr })
    const pass = Math.abs(r.result - expected) < 1e-8
    console.log(`[09] ${expr} = ${r.result} (expected ${expected}) ${pass ? '✓' : '❌'}`)
  }
}
