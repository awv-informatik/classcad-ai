// Whitespace handling, syntax edge cases
export default async function (api) {
  // Whitespace
  const r1 = await api.v1.common.evaluateExpression({ expression: ' 2 + 3 ' })
  console.log('[10] " 2 + 3 ":', r1.result)

  // No spaces
  const r2 = await api.v1.common.evaluateExpression({ expression: '2+3' })
  console.log('[10] "2+3":', r2.result)

  // Exponent notation
  const r3 = await api.v1.common.evaluateExpression({ expression: '1e3' })
  console.log('[10] "1e3":', r3.result, '(expected 1000)')

  // Power operator ^ or ** ?
  const tests = ['^', '**']
  for (const op of tests) {
    try {
      const r = await api.v1.common.evaluateExpression({ expression: `2${op}3` })
      console.log(`[10] "2${op}3":`, r.result, 'maxLevel:', r.maxLevel)
    } catch (e) {
      console.log(`[10] "2${op}3": error -`, e.message)
    }
  }

  // Modulo operator %
  const r4 = await api.v1.common.evaluateExpression({ expression: '17%5' })
  console.log('[10] "17%5":', r4.result, 'maxLevel:', r4.maxLevel)

  // String in expression
  const r5 = await api.v1.common.evaluateExpression({ expression: '"hello"' })
  console.log('[10] string:', r5.result, 'maxLevel:', r5.maxLevel)
}
