// Test empty toUpdate array and omitted toUpdate
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({ id: partId, toCreate: [{ name: 'x', value: 5 }] })

  // Empty array
  const r1 = await api.v1.part.updateExpression({ id: partId, toUpdate: [] })
  console.log('[06] empty array result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Omitted toUpdate entirely
  const r2 = await api.v1.part.updateExpression({ id: partId })
  console.log('[06] omitted result:', r2.result, 'maxLevel:', r2.maxLevel)

  // Value unchanged
  const check = await api.v1.part.getExpression({ id: partId, name: 'x' })
  console.log('[06] x still:', check.result.value)

  return { partId }
}
