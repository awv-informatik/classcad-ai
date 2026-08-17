// id param — context for named expressions
export default async function (api) {
  // First: without id, no part — basic expression
  const r1 = await api.v1.common.evaluateExpression({ expression: '10+20' })
  console.log('[07] no id, no part:', r1.result)

  // Create a part with named expressions
  const partId = (await api.v1.part.create({ name: 'ExprTest' })).result
  console.log('[07] partId:', partId)

  // Create named expressions
  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'width', value: 50 },
      { name: 'height', value: 'width * 2' },
    ],
  })

  // Now evaluate referencing named expression — need id
  const r2 = await api.v1.common.evaluateExpression({ expression: 'width + 10', id: partId })
  console.log('[07] with id, "width + 10":', r2.result, '(expected 60)')

  const r3 = await api.v1.common.evaluateExpression({ expression: 'height', id: partId })
  console.log('[07] with id, "height":', r3.result, '(expected 100)')

  // Without id — can it still see named expressions?
  const r4 = await api.v1.common.evaluateExpression({ expression: 'width + 10' })
  console.log('[07] without id, "width + 10":', r4.result, 'maxLevel:', r4.maxLevel)

  return { partId }
}
