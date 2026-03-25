// Get expression after formula update (not just value update)
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'x', value: 10 },
      { name: 'y', value: 'x + 5' },
    ],
  })

  const before = await api.v1.part.getExpression({ id: partId, name: 'y' })
  console.log('[11] before:', JSON.stringify(before.result))

  // Update formula, not just value
  await api.v1.part.updateExpression({
    id: partId,
    toUpdate: [{ name: 'y', value: 'x * 10' }],
  })

  const after = await api.v1.part.getExpression({ id: partId, name: 'y' })
  console.log('[11] after formula change:', JSON.stringify(after.result))

  return { partId }
}
