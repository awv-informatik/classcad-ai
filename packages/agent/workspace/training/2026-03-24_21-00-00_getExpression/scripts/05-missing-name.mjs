// Get expression with missing name param or empty string name
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'x', value: 10 }],
  })

  // Missing name param
  const r1 = await api.v1.part.getExpression({ id: partId })
  console.log('[05] no name result:', JSON.stringify(r1.result))
  console.log('[05] no name maxLevel:', r1.maxLevel)
  console.log('[05] no name messages:', JSON.stringify(r1.messages?.map(m => m.message)))

  // Empty string name
  const r2 = await api.v1.part.getExpression({ id: partId, name: '' })
  console.log('[05] empty name result:', JSON.stringify(r2.result))
  console.log('[05] empty name maxLevel:', r2.maxLevel)
  console.log('[05] empty name messages:', JSON.stringify(r2.messages?.map(m => m.message)))

  return { partId }
}
