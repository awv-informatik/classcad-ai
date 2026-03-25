// Empty and omitted toDelete
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({ id: partId, toCreate: [{ name: 'x', value: 5 }] })

  const r1 = await api.v1.part.deleteExpression({ id: partId, toDelete: [] })
  console.log('[04] empty array result:', r1.result, 'maxLevel:', r1.maxLevel)

  const r2 = await api.v1.part.deleteExpression({ id: partId })
  console.log('[04] omitted result:', r2.result, 'maxLevel:', r2.maxLevel)

  const check = await api.v1.part.getExpression({ id: partId, name: 'x' })
  console.log('[04] x still:', check.result.value)

  return { partId }
}
