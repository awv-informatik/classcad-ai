// Can you recreate an expression after deleting it?
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create, delete, recreate
  await api.v1.part.expression({ id: partId, toCreate: [{ name: 'x', value: 10 }] })
  await api.v1.part.deleteExpression({ id: partId, toDelete: ['x'] })

  const mid = await api.v1.part.getExpression({ id: partId, name: 'x' })
  console.log('[13] after delete:', JSON.stringify(mid.result))

  const cr = await api.v1.part.expression({ id: partId, toCreate: [{ name: 'x', value: 99 }] })
  console.log('[13] recreate result:', cr.result, 'maxLevel:', cr.maxLevel)

  const after = await api.v1.part.getExpression({ id: partId, name: 'x' })
  console.log('[13] after recreate:', JSON.stringify(after.result))

  return { partId }
}
