// Test missing value field in toUpdate item
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({ id: partId, toCreate: [{ name: 'x', value: 10 }] })

  // Missing value
  const r1 = await api.v1.part.updateExpression({
    id: partId,
    toUpdate: [{ name: 'x' }],
  })
  console.log('[16] missing value result:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) {
    for (const m of r1.messages) console.log('[16] msg:', m.level, m.code, m.message)
  }
  const after1 = await api.v1.part.getExpression({ id: partId, name: 'x' })
  console.log('[16] after missing value:', JSON.stringify(after1.result))

  // Missing name
  const r2 = await api.v1.part.updateExpression({
    id: partId,
    toUpdate: [{ value: 99 }],
  })
  console.log('[16] missing name result:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages?.length) {
    for (const m of r2.messages) console.log('[16] msg:', m.level, m.code, m.message)
  }
  const after2 = await api.v1.part.getExpression({ id: partId, name: 'x' })
  console.log('[16] after missing name:', JSON.stringify(after2.result))

  return { partId }
}
