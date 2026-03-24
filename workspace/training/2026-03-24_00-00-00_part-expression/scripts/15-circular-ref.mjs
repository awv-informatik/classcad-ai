// Test: circular references between expressions
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create 'a' first
  await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'a', value: 10 }],
  })

  // Create 'b' referencing 'a'
  await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'b', value: 'a * 2' }],
  })

  // Now try to create 'c' = 'b + a' (valid chain)
  const r1 = await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'c', value: 'b + a' }],
  })
  console.log('[15] chain (c=b+a):', r1.result, 'maxLevel:', r1.maxLevel)
  const cVal = await api.v1.common.evaluateExpression({ expression: 'c', id: 6 })
  console.log('[15] c value:', cVal.result, '(expected 30)')

  // Now try self-reference: d = d + 1
  const r2 = await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'd', value: 'd + 1' }],
  })
  console.log('[15] self-ref (d=d+1):', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages?.length) console.log('[15] messages:', r2.messages[0].message.substring(0, 120))

  return { partId }
}
