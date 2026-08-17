// Delete an expression that is referenced by another expression's formula
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'base', value: 10 },
      { name: 'derived', value: 'base * 2' },
    ],
  })

  const beforeDerived = await api.v1.part.getExpression({ id: partId, name: 'derived' })
  console.log('[05] before derived:', JSON.stringify(beforeDerived.result))

  // Delete base — what happens to derived?
  const dr = await api.v1.part.deleteExpression({
    id: partId,
    toDelete: ['base'],
  })
  console.log('[05] delete base result:', dr.result, 'maxLevel:', dr.maxLevel)
  if (dr.messages?.length) {
    for (const m of dr.messages) console.log('[05] msg:', m.level, m.code, m.message)
  }

  // Check derived
  const afterDerived = await api.v1.part.getExpression({ id: partId, name: 'derived' })
  console.log('[05] after derived:', JSON.stringify(afterDerived.result))

  // Check base is gone
  const afterBase = await api.v1.part.getExpression({ id: partId, name: 'base' })
  console.log('[05] base gone?', afterBase.result.value === null)

  return { partId }
}
