// Test: update two expressions in same call where one depends on the other
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'base', value: 10 },
      { name: 'derived', value: 'base * 2' },
    ],
  })

  const before = {
    base: (await api.v1.part.getExpression({ id: partId, name: 'base' })).result,
    derived: (await api.v1.part.getExpression({ id: partId, name: 'derived' })).result,
  }
  console.log('[20] before:', JSON.stringify(before))

  // Update both: base to 50, and change derived formula to base * 3
  const ur = await api.v1.part.updateExpression({
    id: partId,
    toUpdate: [
      { name: 'base', value: 50 },
      { name: 'derived', value: 'base * 3' },
    ],
  })
  console.log('[20] result:', ur.result, 'maxLevel:', ur.maxLevel)

  const after = {
    base: (await api.v1.part.getExpression({ id: partId, name: 'base' })).result,
    derived: (await api.v1.part.getExpression({ id: partId, name: 'derived' })).result,
  }
  console.log('[20] after:', JSON.stringify(after))
  console.log('[20] derived uses new base?', after.derived.value === 150 ? 'yes (150)' : `no (${after.derived.value})`)

  return { partId }
}
