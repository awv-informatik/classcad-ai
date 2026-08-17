// evaluateExpression with id param — can it reference named expressions?
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'width', value: 100 },
      { name: 'height', value: 50 },
    ],
  })

  // Without id — should NOT see named expressions
  const r1 = await api.v1.common.evaluateExpression({ expression: 'width + height', silent: true })
  console.log('[14] without id:', r1.result, 'maxLevel:', r1.maxLevel)

  // With id — should see named expressions
  const r2 = await api.v1.common.evaluateExpression({ expression: 'width + height', id: partId })
  console.log('[14] with part id:', r2.result, 'maxLevel:', r2.maxLevel)

  // With id — formula
  const r3 = await api.v1.common.evaluateExpression({ expression: 'width * height', id: partId })
  console.log('[14] width*height:', r3.result, 'maxLevel:', r3.maxLevel)

  // With id — mixed
  const r4 = await api.v1.common.evaluateExpression({ expression: 'sqrt(pow(width, 2) + pow(height, 2))', id: partId })
  console.log('[14] diagonal:', r4.result, 'maxLevel:', r4.maxLevel)

  return { partId }
}
