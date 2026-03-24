// Test: can you create a base expression and a formula referencing it in the SAME toCreate call?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create base and dependent in one call
  const r = await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'w', value: 50 },
      { name: 'h', value: 'w * 2' },
    ],
  })

  console.log('[04] result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[04] messages:', JSON.stringify(r.messages))

  // Verify
  const wVal = await api.v1.common.evaluateExpression({ expression: 'w', id: 6 })
  const hVal = await api.v1.common.evaluateExpression({ expression: 'h', id: 6 })
  console.log('[04] w:', wVal.result, 'h:', hVal.result)

  return { partId }
}
