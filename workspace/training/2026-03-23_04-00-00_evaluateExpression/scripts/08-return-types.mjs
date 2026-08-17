// Return types — can it return point? What about VOID?
export default async function (api) {
  // Real
  const r1 = await api.v1.common.evaluateExpression({ expression: '42' })
  console.log('[08] "42" → result:', r1.result, 'type:', typeof r1.result)

  // Try to get point return — docs say result can be real|point|VOID
  // Can we evaluate a point expression somehow?
  const r2 = await api.v1.common.evaluateExpression({ expression: '0' })
  console.log('[08] "0" → result:', r2.result, 'type:', typeof r2.result)

  // VOID case — invalid expression
  const r3 = await api.v1.common.evaluateExpression({ expression: 'INVALID' })
  console.log('[08] INVALID → result:', r3.result, 'type:', typeof r3.result, 'is null:', r3.result === null)

  // Negative number
  const r4 = await api.v1.common.evaluateExpression({ expression: '-3.14' })
  console.log('[08] "-3.14" → result:', r4.result, 'type:', typeof r4.result)

  // Very large number
  const r5 = await api.v1.common.evaluateExpression({ expression: 'pow(2, 53)' })
  console.log('[08] pow(2,53) → result:', r5.result)

  // Very small number
  const r6 = await api.v1.common.evaluateExpression({ expression: '1/1000000' })
  console.log('[08] 1/1000000 → result:', r6.result)
}
