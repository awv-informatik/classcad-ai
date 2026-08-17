// Swap two expression names in one call: a→b, b→a
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'a', value: 10 },
      { name: 'b', value: 20 },
    ],
  })

  const rr = await api.v1.part.renameExpression({
    id: partId,
    toRename: [
      { name: 'a', newName: 'b' },
      { name: 'b', newName: 'a' },
    ],
  })
  console.log('[10] swap result:', rr.result, 'maxLevel:', rr.maxLevel)
  if (rr.messages?.length) {
    for (const m of rr.messages) console.log('[10] msg:', m.level, m.code, m.message)
  }

  const ra = await api.v1.part.getExpression({ id: partId, name: 'a' })
  const rb = await api.v1.part.getExpression({ id: partId, name: 'b' })
  console.log('[10] a:', ra.result.value, 'b:', rb.result.value)

  return { partId }
}
