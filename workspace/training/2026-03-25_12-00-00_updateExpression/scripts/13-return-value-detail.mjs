// Examine the full return value structure of updateExpression
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'a', value: 10 }],
  })

  // Success case
  const success = await api.v1.part.updateExpression({
    id: partId,
    toUpdate: [{ name: 'a', value: 20 }],
  })
  console.log('[13] success result type:', typeof success.result, 'value:', success.result)
  console.log('[13] success messages:', JSON.stringify(success.messages))
  console.log('[13] success maxLevel:', success.maxLevel)

  // Failure case (nonexistent)
  const fail = await api.v1.part.updateExpression({
    id: partId,
    toUpdate: [{ name: 'nope', value: 1 }],
  })
  console.log('[13] fail result type:', typeof fail.result, 'value:', fail.result)
  console.log('[13] fail messages:', JSON.stringify(fail.messages))
  console.log('[13] fail maxLevel:', fail.maxLevel)

  // Check: does result return boolean true/false or numeric 1/0?
  console.log('[13] success.result === true:', success.result === true)
  console.log('[13] success.result === 1:', success.result === 1)
  console.log('[13] fail.result === false:', fail.result === false)
  console.log('[13] fail.result === 0:', fail.result === 0)

  return { partId }
}
