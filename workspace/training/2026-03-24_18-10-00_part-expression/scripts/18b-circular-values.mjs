// Check actual values of circular references
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'a', value: 'b + 1' },
      { name: 'b', value: 'a + 1' },
    ],
  })
  const va = await api.v1.common.evaluateExpression({ expression: 'a', id: 6 })
  const vb = await api.v1.common.evaluateExpression({ expression: 'b', id: 6 })
  console.log('[18b] a =', va.result, 'b =', vb.result)
  const ga = await api.v1.part.getExpression({ id: partId, name: 'a' })
  const gb = await api.v1.part.getExpression({ id: partId, name: 'b' })
  console.log('[18b] getA:', JSON.stringify(ga.result))
  console.log('[18b] getB:', JSON.stringify(gb.result))
  return { a: va.result, b: vb.result }
}
