// Operator precedence deep dive
export default async function (api) {
  const tests = [
    ['2 + 3 * 4', 14],         // * before +
    ['2 * 3 + 4', 10],
    ['10 - 6 / 2', 7],         // / before -
    ['10 / 2 - 3', 2],
    ['-2 * 3', -6],            // unary minus
    ['-(2 * 3)', -6],
    ['-2 + 3', 1],
    ['2 + -3', -1],            // unary minus in expression
    ['(2 + 3) * (4 + 5)', 45],
    ['((2 + 3) * 4) + 5', 25],
    ['2 * (3 + 4) * (5 + 6)', 154],  // 2 * 7 * 11
  ]

  for (const [expr, expected] of tests) {
    const r = await api.v1.common.evaluateExpression({ expression: expr })
    const ok = Math.abs(r.result - expected) < 1e-10 ? '✓' : '❌'
    console.log(`[20] ${ok} '${expr}' = ${r.result} (expected ${expected})`)
  }

  return {}
}
