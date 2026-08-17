// Trigonometric functions — all in radians
export default async function (api) {
  const PI = Math.PI
  const tests = [
    ['sin(0)', 0],
    ['sin(C:PI/2)', 1],
    ['sin(C:PI)', 0],
    ['cos(0)', 1],
    ['cos(C:PI)', -1],
    ['cos(C:PI/2)', 0],
    ['tan(0)', 0],
    ['tan(C:PI/4)', 1],
    ['asin(1)', PI/2],
    ['asin(0)', 0],
    ['acos(1)', 0],
    ['acos(0)', PI/2],
    ['atan(1)', PI/4],
    ['atan(0)', 0],
    ['atan(1, 1)', null],     // 2-arg form: atan2?
    ['atan(-1, 1)', null],
    ['atan(1, -1)', null],
    ['sinh(0)', 0],
    ['cosh(0)', 1],
    ['tanh(0)', 0],
    ['sinh(1)', null],        // ~1.1752
    ['cosh(1)', null],        // ~1.5431
  ]

  for (const [expr, expected] of tests) {
    const r = await api.v1.common.evaluateExpression({ expression: expr })
    const ok = expected !== null ? (Math.abs(r.result - expected) < 1e-6 ? '✓' : '❌') : '?'
    console.log(`[04] ${ok} '${expr}' = ${r.result}${expected !== null ? ` (expected ~${expected.toFixed(6)})` : ''} maxLevel:${r.maxLevel}`)
  }

  return {}
}
