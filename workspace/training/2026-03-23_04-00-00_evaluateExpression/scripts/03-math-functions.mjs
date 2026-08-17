// Math functions: abs, sign, max, min, sqrt, pow, exp, ln, log
export default async function (api) {
  const tests = [
    ['abs(-42)', 42],
    ['abs(42)', 42],
    ['sign(-7)', -1],
    ['sign(0)', 0],
    ['sign(7)', 1],
    ['max(1, 5, 3)', 5],
    ['min(1, 5, 3)', 1],
    ['sqrt(144)', 12],
    ['sqrt(2)', Math.sqrt(2)],
    ['pow(2, 10)', 1024],
    ['pow(3, 0)', 1],
    ['exp(0)', 1],
    ['exp(1)', Math.E],
    ['ln(1)', 0],
    ['ln(exp(1))', 1],      // ln(e) = 1
  ]
  for (const [expr, expected] of tests) {
    const r = await api.v1.common.evaluateExpression({ expression: expr })
    const pass = Math.abs(r.result - expected) < 1e-10
    console.log(`[03] ${expr} = ${r.result} (expected ${expected}) ${pass ? '✓' : '❌'}`)
  }
}
