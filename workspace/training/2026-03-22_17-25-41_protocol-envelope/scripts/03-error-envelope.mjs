// 03 — What does the envelope look like on errors?
// Test: wrong API name, missing required params, bad expression

export default async function ({ execute }) {
  // 1. Invalid expression (should return VOID per docs)
  const badExpr = await execute({ 'v1.common.evaluateExpression': [{ expression: 'this is garbage' }] })
  console.log('[error] badExpr result:', JSON.stringify(badExpr.result))
  console.log('[error] badExpr messages:', JSON.stringify(badExpr.messages, null, 2))
  console.log('[error] badExpr maxLevel:', badExpr.maxLevel)

  // 2. evaluateExpression with silent=TRUE (should suppress error message)
  const silentExpr = await execute({ 'v1.common.evaluateExpression': [{ expression: 'this is garbage', silent: true }] })
  console.log('[error] silentExpr result:', JSON.stringify(silentExpr.result))
  console.log('[error] silentExpr messages:', JSON.stringify(silentExpr.messages))
  console.log('[error] silentExpr maxLevel:', silentExpr.maxLevel)

  return {}
}
