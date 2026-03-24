// Create expressions with string formula values, including cross-references
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  const r = await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'base', value: 40 },
      { name: 'doubled', value: 'base * 2' },
      { name: 'tripled', value: 'base * 3' },
      { name: 'combined', value: 'doubled + tripled' },
    ],
  })

  console.log('[03] result:', r.result)
  console.log('[03] maxLevel:', r.maxLevel)
  console.log('[03] messages:', JSON.stringify(r.messages))

  // Verify values using evaluateExpression
  // Need ExpressionSet ID — typically 6 from prior training
  const v1 = await api.v1.common.evaluateExpression({ expression: 'base', id: 6 })
  const v2 = await api.v1.common.evaluateExpression({ expression: 'doubled', id: 6 })
  const v3 = await api.v1.common.evaluateExpression({ expression: 'combined', id: 6 })

  console.log('[03] base =', v1.result)
  console.log('[03] doubled =', v2.result)
  console.log('[03] combined =', v3.result)

  return { partId, base: v1.result, doubled: v2.result, combined: v3.result }
}
