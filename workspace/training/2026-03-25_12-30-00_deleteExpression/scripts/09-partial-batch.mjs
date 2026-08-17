// Partial batch: mix of valid and invalid names
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'a', value: 1 },
      { name: 'b', value: 2 },
    ],
  })

  const dr = await api.v1.part.deleteExpression({
    id: partId,
    toDelete: ['a', 'doesNotExist', 'b'],
  })
  console.log('[09] partial batch result:', dr.result, 'maxLevel:', dr.maxLevel)
  if (dr.messages?.length) {
    for (const m of dr.messages) console.log('[09] msg:', m.level, m.code, m.message)
  }

  // Did valid deletes apply?
  const ra = await api.v1.part.getExpression({ id: partId, name: 'a' })
  const rb = await api.v1.part.getExpression({ id: partId, name: 'b' })
  console.log('[09] a:', ra.result.value, 'b:', rb.result.value)
  console.log('[09] a deleted?', ra.result.value === null, 'b deleted?', rb.result.value === null)

  return { partId }
}
