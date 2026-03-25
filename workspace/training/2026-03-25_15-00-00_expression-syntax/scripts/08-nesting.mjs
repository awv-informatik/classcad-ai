// Nested functions and complex expressions
export default async function (api) {
  const tests = [
    ['sqrt(pow(3, 2) + pow(4, 2))', 5],           // Pythagorean
    ['sin(asin(0.5))', 0.5],                       // round-trip
    ['cos(acos(0.5))', 0.5],
    ['abs(sin(C:PI))', 0],                          // abs(~0)
    ['max(sin(0), cos(0), tan(0))', 1],             // max(0, 1, 0)
    ['pow(sqrt(2), 2)', 2],                         // round-trip
    ['ln(exp(5))', 5],
    ['sqrt(abs(-16))', 4],                          // nested
    ['min(pow(2,3), pow(3,2))', 8],                 // min(8, 9)
    ['sin(a_r(30))', 0.5],                          // sin(30°)
    // Deep nesting
    ['sqrt(sqrt(sqrt(256)))', 2],                   // 256^(1/8) = 2
    ['abs(min(-5, -3) + max(1, 2))', 3],            // abs(-5 + 2) = 3
  ]

  for (const [expr, expected] of tests) {
    const r = await api.v1.common.evaluateExpression({ expression: expr })
    const ok = Math.abs(r.result - expected) < 1e-6 ? '✓' : '❌'
    console.log(`[08] ${ok} '${expr}' = ${r.result} (expected ${expected}) maxLevel:${r.maxLevel}`)
  }

  return {}
}
