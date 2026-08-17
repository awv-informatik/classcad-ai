// Test updating multiple expressions in one toUpdate array
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'a', value: 1 },
      { name: 'b', value: 2 },
      { name: 'c', value: 3 },
    ],
  })

  // Update all three at once
  const ur = await api.v1.part.updateExpression({
    id: partId,
    toUpdate: [
      { name: 'a', value: 10 },
      { name: 'b', value: 20 },
      { name: 'c', value: 30 },
    ],
  })
  console.log('[05] batch update result:', ur.result, 'maxLevel:', ur.maxLevel)

  const ra = await api.v1.part.getExpression({ id: partId, name: 'a' })
  const rb = await api.v1.part.getExpression({ id: partId, name: 'b' })
  const rc = await api.v1.part.getExpression({ id: partId, name: 'c' })
  console.log('[05] a:', ra.result.value, 'b:', rb.result.value, 'c:', rc.result.value)

  return { partId }
}
