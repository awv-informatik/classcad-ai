// Test: docs say param can be object | Array<object> — test array form
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Try passing param as an array of objects (batch mode per docs)
  const r = await api.v1.part.expression([
    { id: partId, toCreate: [{ name: 'a', value: 10 }] },
    { id: partId, toCreate: [{ name: 'b', value: 20 }] },
  ])

  console.log('[08] array param result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[08] messages:', JSON.stringify(r.messages))

  // Verify both exist
  const aVal = await api.v1.common.evaluateExpression({ expression: 'a', id: 6 })
  const bVal = await api.v1.common.evaluateExpression({ expression: 'b', id: 6 })
  console.log('[08] a:', aVal.result, 'b:', bVal.result)

  return { partId }
}
