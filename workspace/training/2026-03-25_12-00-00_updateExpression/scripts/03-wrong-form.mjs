// Test the WRONG form: direct name/value instead of toUpdate array
// Existing LLM doc claims this silently succeeds with result=1 but no change
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'size', value: 50 }],
  })

  const before = await api.v1.part.getExpression({ id: partId, name: 'size' })
  console.log('[03] before:', JSON.stringify(before.result))

  // WRONG: direct name/value params (not in toUpdate array)
  const ur = await api.v1.part.updateExpression({
    id: partId,
    name: 'size',
    value: 999,
  })
  console.log('[03] wrong form result:', ur.result, 'maxLevel:', ur.maxLevel)

  const after = await api.v1.part.getExpression({ id: partId, name: 'size' })
  console.log('[03] after wrong form:', JSON.stringify(after.result))
  console.log('[03] value changed?', before.result.value !== after.result.value)

  return { partId }
}
