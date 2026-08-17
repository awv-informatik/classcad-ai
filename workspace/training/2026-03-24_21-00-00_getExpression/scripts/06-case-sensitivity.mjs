// Test case sensitivity of expression names
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'MyVar', value: 42 }],
  })

  const r1 = await api.v1.part.getExpression({ id: partId, name: 'MyVar' })
  const r2 = await api.v1.part.getExpression({ id: partId, name: 'myvar' })
  const r3 = await api.v1.part.getExpression({ id: partId, name: 'MYVAR' })
  const r4 = await api.v1.part.getExpression({ id: partId, name: 'myVar' })

  console.log('[06] MyVar (exact):', JSON.stringify(r1.result))
  console.log('[06] myvar (lower):', JSON.stringify(r2.result))
  console.log('[06] MYVAR (upper):', JSON.stringify(r3.result))
  console.log('[06] myVar (camel):', JSON.stringify(r4.result))

  return { partId }
}
