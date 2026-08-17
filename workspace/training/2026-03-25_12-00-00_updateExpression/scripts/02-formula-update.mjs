// Test updating a numeric value to a formula string, and vice versa
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'base', value: 50 },
      { name: 'derived', value: 100 },
    ],
  })

  // Update 'derived' from numeric to formula referencing 'base'
  const ur1 = await api.v1.part.updateExpression({
    id: partId,
    toUpdate: [{ name: 'derived', value: 'base * 3' }],
  })
  const after1 = await api.v1.part.getExpression({ id: partId, name: 'derived' })
  console.log('[02] numeric→formula result:', ur1.result, 'maxLevel:', ur1.maxLevel)
  console.log('[02] after formula update:', JSON.stringify(after1.result))

  // Update 'derived' from formula back to numeric
  const ur2 = await api.v1.part.updateExpression({
    id: partId,
    toUpdate: [{ name: 'derived', value: 42 }],
  })
  const after2 = await api.v1.part.getExpression({ id: partId, name: 'derived' })
  console.log('[02] formula→numeric result:', ur2.result, 'maxLevel:', ur2.maxLevel)
  console.log('[02] after numeric update:', JSON.stringify(after2.result))

  return { partId }
}
