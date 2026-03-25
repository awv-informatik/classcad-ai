// Basic arithmetic operators: +, -, *, /
export default async function (api) {
  const tests = [
    ['2 + 3', 5],
    ['10 - 4', 6],
    ['3 * 7', 21],
    ['20 / 4', 5],
    ['7 / 2', 3.5],
    ['-5', -5],
    ['+5', 5],
    ['2 + 3 * 4', 14],       // precedence: * before +
    ['(2 + 3) * 4', 20],     // parentheses
    ['10 / 3', null],        // check precision
    ['0.1 + 0.2', null],    // floating point
    ['1e3', null],           // scientific notation?
    ['100 / 0', null],       // division by zero
  ]

  for (const [expr, expected] of tests) {
    const r = await api.v1.common.evaluateExpression({ expression: expr })
    const ok = expected !== null ? (Math.abs(r.result - expected) < 1e-10 ? '✓' : '❌') : '?'
    console.log(`[01] ${ok} '${expr}' = ${r.result}${expected !== null ? ` (expected ${expected})` : ''} maxLevel:${r.maxLevel}`)
  }

  return {}
}
