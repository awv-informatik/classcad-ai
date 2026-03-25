// Get a plain numeric expression — verify return structure
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'width', value: 50 }],
  })

  const r = await api.v1.part.getExpression({ id: partId, name: 'width' })
  console.log('[01] full result:', JSON.stringify(r.result))
  console.log('[01] maxLevel:', r.maxLevel)
  console.log('[01] value type:', typeof r.result?.value)
  console.log('[01] expression type:', typeof r.result?.expression)
  console.log('[01] expression repr:', JSON.stringify(r.result?.expression))

  return { partId }
}
