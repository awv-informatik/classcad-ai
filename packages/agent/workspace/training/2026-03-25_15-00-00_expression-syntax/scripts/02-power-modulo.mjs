// Power operator (^?) and modulo (%)
export default async function (api) {
  const tests = [
    ['2^3', null],           // does ^ work as power?
    ['pow(2, 3)', 8],
    ['pow(2, 0.5)', null],   // sqrt via pow
    ['pow(10, -1)', 0.1],
    ['fmod(10, 3)', 1],
    ['fmod(7.5, 2)', 1.5],
    ['fmod(-10, 3)', null],  // negative modulo
    ['div(10, 3)', 3],
    ['div(7, 2)', 3],
    ['div(-7, 2)', null],    // negative integer div
    ['10 % 3', null],        // does % operator work?
    ['2 ** 3', null],        // does ** work?
  ]

  for (const [expr, expected] of tests) {
    const r = await api.v1.common.evaluateExpression({ expression: expr })
    const ok = expected !== null ? (Math.abs(r.result - expected) < 1e-10 ? '✓' : '❌') : '?'
    console.log(`[02] ${ok} '${expr}' = ${r.result} maxLevel:${r.maxLevel}${expected !== null ? ` (expected ${expected})` : ''}`)
  }

  return {}
}
