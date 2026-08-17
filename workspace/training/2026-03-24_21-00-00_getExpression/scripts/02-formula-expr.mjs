// Get a formula-based expression — verify expression field contains the formula
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'base', value: 100 },
      { name: 'derived', value: 'base * 2 + 10' },
      { name: 'piArea', value: 'C:PI * pow(base, 2)' },
    ],
  })

  const r1 = await api.v1.part.getExpression({ id: partId, name: 'base' })
  const r2 = await api.v1.part.getExpression({ id: partId, name: 'derived' })
  const r3 = await api.v1.part.getExpression({ id: partId, name: 'piArea' })

  console.log('[02] base:', JSON.stringify(r1.result))
  console.log('[02] derived:', JSON.stringify(r2.result))
  console.log('[02] piArea:', JSON.stringify(r3.result))

  return { partId }
}
