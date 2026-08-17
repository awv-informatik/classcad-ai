// Test updating to the same value (no-op or actual update?)
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({ id: partId, toCreate: [{ name: 'x', value: 42 }] })

  const ur = await api.v1.part.updateExpression({
    id: partId,
    toUpdate: [{ name: 'x', value: 42 }],
  })
  console.log('[15] same value result:', ur.result, 'maxLevel:', ur.maxLevel)

  const after = await api.v1.part.getExpression({ id: partId, name: 'x' })
  console.log('[15] after:', JSON.stringify(after.result))

  return { partId }
}
