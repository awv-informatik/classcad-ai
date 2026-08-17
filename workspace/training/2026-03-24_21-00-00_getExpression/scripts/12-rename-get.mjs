// Get expression after rename — does old name return VOID? Does new name work?
// renameExpression uses toRename array with { name, newName }
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'oldName', value: 77 }],
  })

  const before = await api.v1.part.getExpression({ id: partId, name: 'oldName' })
  console.log('[12] before rename (oldName):', JSON.stringify(before.result))

  const renameResult = await api.v1.part.renameExpression({
    id: partId,
    toRename: [{ name: 'oldName', newName: 'newName' }],
  })
  console.log('[12] rename result:', renameResult.result, 'maxLevel:', renameResult.maxLevel)

  const afterOld = await api.v1.part.getExpression({ id: partId, name: 'oldName' })
  const afterNew = await api.v1.part.getExpression({ id: partId, name: 'newName' })
  console.log('[12] after rename (oldName):', JSON.stringify(afterOld.result))
  console.log('[12] after rename (newName):', JSON.stringify(afterNew.result))

  return { partId }
}
