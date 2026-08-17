// Get expression with circular reference
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'a', value: 'b + 1' },
      { name: 'b', value: 'a + 1' },
    ],
  })

  const ra = await api.v1.part.getExpression({ id: partId, name: 'a' })
  const rb = await api.v1.part.getExpression({ id: partId, name: 'b' })
  console.log('[10] circular a:', JSON.stringify(ra.result))
  console.log('[10] circular b:', JSON.stringify(rb.result))

  return { partId }
}
