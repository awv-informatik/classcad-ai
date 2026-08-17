// Basic single expression deletion
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'width', value: 100 }],
  })

  const before = await api.v1.part.getExpression({ id: partId, name: 'width' })
  console.log('[01] before:', JSON.stringify(before.result))

  const dr = await api.v1.part.deleteExpression({
    id: partId,
    toDelete: ['width'],
  })
  console.log('[01] delete result:', dr.result, 'maxLevel:', dr.maxLevel)
  if (dr.messages?.length) {
    for (const m of dr.messages) console.log('[01] msg:', m.level, m.code, m.message)
  }

  const after = await api.v1.part.getExpression({ id: partId, name: 'width' })
  console.log('[01] after:', JSON.stringify(after.result))
  console.log('[01] deleted?', after.result.value === null)

  return { partId }
}
