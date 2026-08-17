// Rename to a name that already exists
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'width', value: 100 },
      { name: 'height', value: 50 },
    ],
  })

  const rr = await api.v1.part.renameExpression({
    id: partId,
    toRename: [{ name: 'width', newName: 'height' }],
  })
  console.log('[05] collision result:', rr.result, 'maxLevel:', rr.maxLevel)
  if (rr.messages?.length) {
    for (const m of rr.messages) console.log('[05] msg:', m.level, m.code, m.message)
  }

  // Both should still exist with original values
  const rw = await api.v1.part.getExpression({ id: partId, name: 'width' })
  const rh = await api.v1.part.getExpression({ id: partId, name: 'height' })
  console.log('[05] width:', rw.result.value, 'height:', rh.result.value)

  return { partId }
}
