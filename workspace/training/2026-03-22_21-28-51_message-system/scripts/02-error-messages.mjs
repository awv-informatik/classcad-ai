// Q: What do error messages look like? Provoke various errors.
export default async function (api) {
  // 1. Invalid API name
  const r1 = await api.v1.common.nonExistentMethod({})
  console.log('[02] invalid API:', JSON.stringify({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, null, 2))

  // 2. Missing required param (part.box needs id)
  const r2 = await api.v1.part.box({})
  console.log('[02] missing param:', JSON.stringify({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, null, 2))

  // 3. Invalid ID
  const r3 = await api.v1.part.box({ id: 999999 })
  console.log('[02] invalid ID:', JSON.stringify({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, null, 2))

  // 4. Invalid expression
  const r4 = await api.v1.common.evaluateExpression({ expression: 'invalid_garbage!!!' })
  console.log('[02] invalid expr:', JSON.stringify({ result: r4.result, messages: r4.messages, maxLevel: r4.maxLevel }, null, 2))
}
