// Debug id param — try different id values and check expression creation
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'ExprDebug' })).result
  console.log('[11] partId:', partId)

  // Create expression
  const exprResult = await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'myval', value: 42 }],
  })
  console.log('[11] expression create result:', exprResult.result, 'maxLevel:', exprResult.maxLevel)
  if (exprResult.messages.length) {
    console.log('[11] expression create messages:', exprResult.messages.map(m => m.message).join('; '))
  }

  // Verify expression exists
  const getExpr = await api.v1.part.getExpression({ id: partId, name: 'myval' })
  console.log('[11] getExpression result:', JSON.stringify(getExpr.result))

  // Try evaluateExpression with different id values
  const r1 = await api.v1.common.evaluateExpression({ expression: 'myval', id: partId })
  console.log('[11] evaluate "myval" with partId:', r1.result, 'maxLevel:', r1.maxLevel)

  // Try with expression set id (node 6 from structure)
  const r2 = await api.v1.common.evaluateExpression({ expression: 'myval', id: 6 })
  console.log('[11] evaluate "myval" with id=6:', r2.result, 'maxLevel:', r2.maxLevel)

  // Try just the number as expression
  const r3 = await api.v1.common.evaluateExpression({ expression: '42' })
  console.log('[11] evaluate "42" (no id):', r3.result)

  return { partId }
}
