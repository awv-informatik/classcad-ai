// Rename to invalid names (spaces, digits, empty)
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

  // Space in name
  const r1 = await api.v1.part.renameExpression({
    id: partId,
    toRename: [{ name: 'a', newName: 'my var' }],
  })
  console.log('[06] space result:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) {
    for (const m of r1.messages) console.log('[06] msg:', m.level, m.code, m.message)
  }

  // Start with digit
  const r2 = await api.v1.part.renameExpression({
    id: partId,
    toRename: [{ name: 'b', newName: '1abc' }],
  })
  console.log('[06] digit result:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages?.length) {
    for (const m of r2.messages) console.log('[06] msg:', m.level, m.code, m.message)
  }

  // Empty string
  const r3 = await api.v1.part.renameExpression({
    id: partId,
    toRename: [{ name: 'c', newName: '' }],
  })
  console.log('[06] empty result:', r3.result, 'maxLevel:', r3.maxLevel)
  if (r3.messages?.length) {
    for (const m of r3.messages) console.log('[06] msg:', m.level, m.code, m.message)
  }

  return { partId }
}
