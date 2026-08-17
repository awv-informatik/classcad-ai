// Whitespace handling in expressions
export default async function (api) {
  const tests = [
    ['2+3', 5],
    ['2 + 3', 5],
    ['  2  +  3  ', 5],
    ['2+ 3', 5],
    ['sin( C:PI / 2 )', 1],
    ['pow( 2 , 3 )', 8],
    ['max( 1 , 2 , 3 )', 3],
  ]

  for (const [expr, expected] of tests) {
    const r = await api.v1.common.evaluateExpression({ expression: expr })
    const ok = Math.abs(r.result - expected) < 1e-10 ? '✓' : '❌'
    console.log(`[11] ${ok} '${expr}' = ${r.result} (expected ${expected})`)
  }

  return {}
}
