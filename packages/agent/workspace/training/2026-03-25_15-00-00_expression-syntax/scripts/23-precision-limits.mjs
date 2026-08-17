// Precision and numerical limits
export default async function (api) {
  const tests = [
    ['0.1 + 0.2', null],              // classic floating point
    ['1/3', null],
    ['1/3 * 3', null],                // should be 1?
    ['pow(2, 53)', null],             // max safe integer
    ['pow(2, 1023)', null],           // near max double
    ['pow(2, 1024)', null],           // overflow?
    ['1e308', null],
    ['1e309', null],                   // overflow?
    ['1e-308', null],
    ['1e-324', null],                  // underflow?
    ['pow(10, 15)', null],
    ['pow(10, 15) + 1', null],        // precision loss?
    // Long expression
    ['1+1+1+1+1+1+1+1+1+1+1+1+1+1+1+1+1+1+1+1', 20],
  ]

  for (const [expr, expected] of tests) {
    const r = await api.v1.common.evaluateExpression({ expression: expr, silent: true })
    const ok = expected !== null ? (Math.abs(r.result - expected) < 1e-10 ? '✓' : '❌') : '?'
    console.log(`[23] ${ok} '${expr}' = ${r.result} maxLevel:${r.maxLevel}`)
  }

  return {}
}
