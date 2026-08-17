// Return value structure: success vs failure
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({ id: partId, toCreate: [{ name: 'x', value: 10 }] })

  // Success
  const success = await api.v1.part.deleteExpression({
    id: partId,
    toDelete: ['x'],
  })
  console.log('[10] success result:', success.result, 'type:', typeof success.result)
  console.log('[10] success === true:', success.result === true, '=== 1:', success.result === 1)
  console.log('[10] success messages:', JSON.stringify(success.messages))
  console.log('[10] success maxLevel:', success.maxLevel)

  // Failure: delete again (already deleted)
  const fail = await api.v1.part.deleteExpression({
    id: partId,
    toDelete: ['x'],
  })
  console.log('[10] fail result:', fail.result, 'type:', typeof fail.result)
  console.log('[10] fail === false:', fail.result === false, '=== 0:', fail.result === 0)
  console.log('[10] fail messages:', JSON.stringify(fail.messages))
  console.log('[10] fail maxLevel:', fail.maxLevel)

  return { partId }
}
