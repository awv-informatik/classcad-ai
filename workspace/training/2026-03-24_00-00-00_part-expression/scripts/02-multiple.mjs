// Test: creating multiple expressions in a single toCreate array
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  const r = await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'width', value: 50 },
      { name: 'height', value: 100 },
      { name: 'depth', value: 25 },
    ],
  })

  console.log('[02] result:', r.result)
  console.log('[02] maxLevel:', r.maxLevel)

  // Verify all three exist via evaluateExpression
  // Need the ExpressionSet ID — from prior training, it's typically 6
  const w = await api.v1.common.evaluateExpression({ expression: 'width', id: 6 })
  const h = await api.v1.common.evaluateExpression({ expression: 'height', id: 6 })
  const d = await api.v1.common.evaluateExpression({ expression: 'depth', id: 6 })

  console.log('[02] width:', w.result, 'height:', h.result, 'depth:', d.result)

  return { partId, result: r.result }
}
