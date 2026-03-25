// Return value structure
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({ id: partId, toCreate: [{ name: 'x', value: 10 }] })

  const success = await api.v1.part.renameExpression({
    id: partId,
    toRename: [{ name: 'x', newName: 'y' }],
  })
  console.log('[12] success result:', success.result, 'type:', typeof success.result)
  console.log('[12] === 1:', success.result === 1, '=== true:', success.result === true)
  console.log('[12] maxLevel:', success.maxLevel)

  const fail = await api.v1.part.renameExpression({
    id: partId,
    toRename: [{ name: 'x', newName: 'z' }],
  })
  console.log('[12] fail result:', fail.result, 'type:', typeof fail.result)
  console.log('[12] === 0:', fail.result === 0, '=== false:', fail.result === false)
  console.log('[12] maxLevel:', fail.maxLevel)

  return { partId }
}
