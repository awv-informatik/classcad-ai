// Rename to the same name (a→a)
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({ id: partId, toCreate: [{ name: 'x', value: 42 }] })

  const rr = await api.v1.part.renameExpression({
    id: partId,
    toRename: [{ name: 'x', newName: 'x' }],
  })
  console.log('[14] same name result:', rr.result, 'maxLevel:', rr.maxLevel)
  if (rr.messages?.length) {
    for (const m of rr.messages) console.log('[14] msg:', m.level, m.code, m.message)
  }

  const check = await api.v1.part.getExpression({ id: partId, name: 'x' })
  console.log('[14] x still:', check.result.value)

  return { partId }
}
