// Rename a non-existent expression
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({ id: partId, toCreate: [{ name: 'x', value: 10 }] })

  const rr = await api.v1.part.renameExpression({
    id: partId,
    toRename: [{ name: 'nope', newName: 'stillnope' }],
  })
  console.log('[04] nonexistent result:', rr.result, 'maxLevel:', rr.maxLevel)
  if (rr.messages?.length) {
    for (const m of rr.messages) console.log('[04] msg:', m.level, m.code, m.message)
  }

  return { partId }
}
