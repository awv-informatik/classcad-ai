// Clarify: evaluateExpression always returns null for result?
// Or does it return the numeric value?
export default async function (api) {
  // Simple known-good expressions
  const r1 = await api.v1.common.evaluateExpression({ expression: '2 + 3' })
  console.log('[25] 2+3 result:', r1.result, 'type:', typeof r1.result)

  const r2 = await api.v1.common.evaluateExpression({ expression: 'C:PI' })
  console.log('[25] C:PI result:', r2.result, 'type:', typeof r2.result)

  // With silent
  const r3 = await api.v1.common.evaluateExpression({ expression: 'C:PI', silent: true })
  console.log('[25] C:PI (silent) result:', r3.result, 'type:', typeof r3.result)

  // Invalid with silent — does it suppress the error AND return null?
  const r4 = await api.v1.common.evaluateExpression({ expression: 'garbage', silent: true })
  console.log('[25] garbage (silent) result:', r4.result, 'maxLevel:', r4.maxLevel)

  // Invalid without silent
  const r5 = await api.v1.common.evaluateExpression({ expression: 'garbage' })
  console.log('[25] garbage result:', r5.result, 'maxLevel:', r5.maxLevel)

  return {}
}
