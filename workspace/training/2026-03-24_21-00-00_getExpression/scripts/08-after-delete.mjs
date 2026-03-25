// Get expression after it has been deleted
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'temp', value: 99 }],
  })

  const before = await api.v1.part.getExpression({ id: partId, name: 'temp' })
  console.log('[08] before delete:', JSON.stringify(before.result))

  await api.v1.part.deleteExpression({ id: partId, toDelete: ['temp'] })

  const after = await api.v1.part.getExpression({ id: partId, name: 'temp' })
  console.log('[08] after delete result:', JSON.stringify(after.result))
  console.log('[08] after delete maxLevel:', after.maxLevel)
  console.log('[08] after delete messages:', JSON.stringify(after.messages?.map(m => m.message)))

  return { partId }
}
