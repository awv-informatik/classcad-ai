// Rename an expression that IS a formula — does the formula survive?
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'base', value: 10 },
      { name: 'area', value: 'base * base' },
    ],
  })

  const before = await api.v1.part.getExpression({ id: partId, name: 'area' })
  console.log('[15] before:', JSON.stringify(before.result))

  // Rename the formula expression itself
  await api.v1.part.renameExpression({
    id: partId,
    toRename: [{ name: 'area', newName: 'surfaceArea' }],
  })

  const after = await api.v1.part.getExpression({ id: partId, name: 'surfaceArea' })
  console.log('[15] after:', JSON.stringify(after.result))
  console.log('[15] formula preserved?', after.result.expression === 'base * base')

  return { partId }
}
