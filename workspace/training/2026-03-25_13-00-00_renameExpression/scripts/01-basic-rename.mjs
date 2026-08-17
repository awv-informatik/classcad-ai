// Basic rename and verify old name is gone, new name has the value
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({ id: partId, toCreate: [{ name: 'width', value: 100 }] })

  const rr = await api.v1.part.renameExpression({
    id: partId,
    toRename: [{ name: 'width', newName: 'w' }],
  })
  console.log('[01] rename result:', rr.result, 'maxLevel:', rr.maxLevel)

  const oldName = await api.v1.part.getExpression({ id: partId, name: 'width' })
  const newName = await api.v1.part.getExpression({ id: partId, name: 'w' })
  console.log('[01] old name:', JSON.stringify(oldName.result))
  console.log('[01] new name:', JSON.stringify(newName.result))

  return { partId }
}
