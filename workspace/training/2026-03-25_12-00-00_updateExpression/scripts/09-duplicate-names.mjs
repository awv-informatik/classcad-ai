// Test duplicate names in one toUpdate call
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({ id: partId, toCreate: [{ name: 'x', value: 10 }] })

  // Same name twice in toUpdate with different values
  const ur = await api.v1.part.updateExpression({
    id: partId,
    toUpdate: [
      { name: 'x', value: 100 },
      { name: 'x', value: 200 },
    ],
  })
  console.log('[09] dup result:', ur.result, 'maxLevel:', ur.maxLevel)

  const after = await api.v1.part.getExpression({ id: partId, name: 'x' })
  console.log('[09] final value:', after.result.value, '(100=first wins, 200=last wins)')

  return { partId }
}
