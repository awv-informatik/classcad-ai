// Delete multiple expressions in one call
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

  const dr = await api.v1.part.deleteExpression({
    id: partId,
    toDelete: ['a', 'b', 'c'],
  })
  console.log('[02] batch delete result:', dr.result, 'maxLevel:', dr.maxLevel)

  const ra = await api.v1.part.getExpression({ id: partId, name: 'a' })
  const rb = await api.v1.part.getExpression({ id: partId, name: 'b' })
  const rc = await api.v1.part.getExpression({ id: partId, name: 'c' })
  console.log('[02] a:', ra.result.value, 'b:', rb.result.value, 'c:', rc.result.value)

  return { partId }
}
