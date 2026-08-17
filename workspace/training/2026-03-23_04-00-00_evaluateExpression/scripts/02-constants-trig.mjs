// Constants and trig functions (radians)
export default async function (api) {
  const tests = [
    ['C:PI', Math.PI],
    ['sin(C:PI/2)', 1],
    ['cos(0)', 1],
    ['cos(C:PI)', -1],
    ['tan(C:PI/4)', 1],
    ['asin(1)', Math.PI/2],
    ['acos(0)', Math.PI/2],
    ['atan(1)', Math.PI/4],
  ]
  for (const [expr, expected] of tests) {
    const r = await api.v1.common.evaluateExpression({ expression: expr })
    const pass = Math.abs(r.result - expected) < 1e-10
    console.log(`[02] ${expr} = ${r.result} (expected ${expected}) ${pass ? '✓' : '❌'}`)
  }
}
