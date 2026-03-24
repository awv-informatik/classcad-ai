// Test: expression values as formula strings (referencing other expressions)
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create base expression first
  const r1 = await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'base', value: 40 }],
  })
  console.log('[03] base created:', r1.result)

  // Create a formula expression referencing 'base'
  const r2 = await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'doubled', value: 'base * 2' }],
  })
  console.log('[03] doubled created:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[03] messages:', JSON.stringify(r2.messages))

  // Verify the formula evaluates correctly
  const val = await api.v1.common.evaluateExpression({ expression: 'doubled', id: 6 })
  console.log('[03] doubled value:', val.result)

  // Also try a formula with math functions
  const r3 = await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'sqrtBase', value: 'sqrt(base)' }],
  })
  console.log('[03] sqrtBase created:', r3.result)
  const sqrtVal = await api.v1.common.evaluateExpression({ expression: 'sqrtBase', id: 6 })
  console.log('[03] sqrtBase value:', sqrtVal.result)

  // Formula with constant
  const r4 = await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'piVal', value: 'C:PI' }],
  })
  console.log('[03] piVal created:', r4.result)
  const piResult = await api.v1.common.evaluateExpression({ expression: 'piVal', id: 6 })
  console.log('[03] piVal value:', piResult.result)

  return { partId }
}
