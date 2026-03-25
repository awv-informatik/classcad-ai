// exp, ln, log, sqrt — and clarify log base
export default async function (api) {
  const tests = [
    ['exp(0)', 1],
    ['exp(1)', Math.E],
    ['ln(1)', 0],
    ['ln(exp(1))', 1],        // should be 1
    ['log(1)', 0],
    ['log(10)', null],         // log10(10)=1? or ln(10)=2.302?
    ['log(100)', null],        // log10(100)=2? or ln(100)=4.605?
    ['log(exp(1))', null],     // if log=ln → 1, if log=log10 → 0.434
    ['sqrt(4)', 2],
    ['sqrt(2)', Math.SQRT2],
    ['sqrt(0)', 0],
    ['sqrt(-1)', null],        // NaN or error?
    ['abs(-5)', 5],
    ['abs(5)', 5],
    ['abs(0)', 0],
    ['sign(-42)', -1],
    ['sign(42)', 1],
    ['sign(0)', 0],
  ]

  for (const [expr, expected] of tests) {
    const r = await api.v1.common.evaluateExpression({ expression: expr, silent: true })
    const ok = expected !== null ? (Math.abs(r.result - expected) < 1e-6 ? '✓' : '❌') : '?'
    console.log(`[06] ${ok} '${expr}' = ${r.result}${expected !== null ? ` (expected ~${expected.toFixed(6)})` : ''} maxLevel:${r.maxLevel}`)
  }

  return {}
}
