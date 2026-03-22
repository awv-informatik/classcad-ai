// 09 — What happens when required params are missing?
// evaluateExpression requires `expression` — omit it

export default async function ({ execute }) {
  // Missing required param
  const missing = await execute({ 'v1.common.evaluateExpression': [{}] })
  console.log('[missing] result:', JSON.stringify(missing.result))
  console.log('[missing] messages:', JSON.stringify(missing.messages, null, 2))
  console.log('[missing] maxLevel:', missing.maxLevel)

  // Empty params to setUserData (requires id, key, value)
  const missing2 = await execute({ 'v1.common.setUserData': [{}] })
  console.log('[missing2] result:', JSON.stringify(missing2.result))
  console.log('[missing2] messages:', JSON.stringify(missing2.messages, null, 2))
  console.log('[missing2] maxLevel:', missing2.maxLevel)

  return {}
}
