// Test partial batch: mix of valid and invalid names in one toUpdate
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'a', value: 1 },
      { name: 'b', value: 2 },
    ],
  })

  // Mix: 'a' exists, 'nope' does not, 'b' exists
  const ur = await api.v1.part.updateExpression({
    id: partId,
    toUpdate: [
      { name: 'a', value: 100 },
      { name: 'nope', value: 999 },
      { name: 'b', value: 200 },
    ],
  })
  console.log('[19] partial batch result:', ur.result, 'maxLevel:', ur.maxLevel)
  if (ur.messages?.length) {
    for (const m of ur.messages) console.log('[19] msg:', m.level, m.code, m.message)
  }

  // Did the valid updates apply?
  const ra = await api.v1.part.getExpression({ id: partId, name: 'a' })
  const rb = await api.v1.part.getExpression({ id: partId, name: 'b' })
  console.log('[19] a:', ra.result.value, 'b:', rb.result.value)
  console.log('[19] valid updates applied?', ra.result.value === 100 && rb.result.value === 200)

  return { partId }
}
