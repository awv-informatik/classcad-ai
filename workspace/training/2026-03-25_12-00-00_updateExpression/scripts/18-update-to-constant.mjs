// Test updating to a constant expression (C:PI, C:E)
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({ id: partId, toCreate: [{ name: 'x', value: 10 }] })

  // Update to C:PI
  const ur = await api.v1.part.updateExpression({
    id: partId,
    toUpdate: [{ name: 'x', value: 'C:PI' }],
  })
  console.log('[18] update to C:PI result:', ur.result, 'maxLevel:', ur.maxLevel)
  const after = await api.v1.part.getExpression({ id: partId, name: 'x' })
  console.log('[18] after C:PI:', JSON.stringify(after.result))

  // Update to formula with C:PI
  const ur2 = await api.v1.part.updateExpression({
    id: partId,
    toUpdate: [{ name: 'x', value: 'C:PI * 2' }],
  })
  const after2 = await api.v1.part.getExpression({ id: partId, name: 'x' })
  console.log('[18] after C:PI*2:', JSON.stringify(after2.result))

  return { partId }
}
