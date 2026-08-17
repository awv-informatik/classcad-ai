// Test updating to an invalid formula (syntax error, undefined ref)
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({ id: partId, toCreate: [{ name: 'x', value: 50 }] })

  // Syntax error
  const r1 = await api.v1.part.updateExpression({
    id: partId,
    toUpdate: [{ name: 'x', value: '2++3' }],
  })
  console.log('[08] syntax error result:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) {
    for (const m of r1.messages) console.log('[08] msg:', m.level, m.code, m.message)
  }
  const after1 = await api.v1.part.getExpression({ id: partId, name: 'x' })
  console.log('[08] after syntax error:', JSON.stringify(after1.result))

  // Undefined variable reference
  const r2 = await api.v1.part.updateExpression({
    id: partId,
    toUpdate: [{ name: 'x', value: 'undefinedVar + 1' }],
  })
  console.log('[08] undef ref result:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages?.length) {
    for (const m of r2.messages) console.log('[08] msg:', m.level, m.code, m.message)
  }
  const after2 = await api.v1.part.getExpression({ id: partId, name: 'x' })
  console.log('[08] after undef ref:', JSON.stringify(after2.result))

  return { partId }
}
