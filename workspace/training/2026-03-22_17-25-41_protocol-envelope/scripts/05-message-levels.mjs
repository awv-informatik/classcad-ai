// 05 — Probe message levels and maxLevel values
// Create a part (should succeed cleanly), then do something that triggers a warning

export default async function (api) {
  // Clean success — part.create
  const create = await api.v1.part.create({ name: 'TestPart' })
  console.log('[levels] part.create result:', create.result, typeof create.result)
  console.log('[levels] part.create messages:', JSON.stringify(create.messages))
  console.log('[levels] part.create maxLevel:', create.maxLevel)

  // Call with extra unexpected params — does it warn?
  const extra = await api.v1.common.getAppVersion({ bogusParam: 123 })
  console.log('[levels] extra param messages:', JSON.stringify(extra.messages))
  console.log('[levels] extra param maxLevel:', extra.maxLevel)

  // evaluateExpression returning a real — check messages on success
  const expr = await api.v1.common.evaluateExpression({ expression: '10*5' })
  console.log('[levels] expr success messages:', JSON.stringify(expr.messages))
  console.log('[levels] expr success maxLevel:', expr.maxLevel)

  return {}
}
