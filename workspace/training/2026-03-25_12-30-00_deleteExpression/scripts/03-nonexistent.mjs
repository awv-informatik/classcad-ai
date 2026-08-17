// Delete a non-existent expression name
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({ id: partId, toCreate: [{ name: 'x', value: 10 }] })

  const dr = await api.v1.part.deleteExpression({
    id: partId,
    toDelete: ['doesNotExist'],
  })
  console.log('[03] nonexistent result:', dr.result, 'maxLevel:', dr.maxLevel)
  if (dr.messages?.length) {
    for (const m of dr.messages) console.log('[03] msg:', m.level, m.code, m.message)
  }

  // Check x is unaffected
  const check = await api.v1.part.getExpression({ id: partId, name: 'x' })
  console.log('[03] x still:', check.result.value)

  return { partId }
}
