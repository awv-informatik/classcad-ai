// Get a non-existent expression name — what does VOID look like?
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'exists', value: 42 }],
  })

  const r = await api.v1.part.getExpression({ id: partId, name: 'doesNotExist' })
  console.log('[03] result:', JSON.stringify(r.result))
  console.log('[03] result === null:', r.result === null)
  console.log('[03] result === undefined:', r.result === undefined)
  console.log('[03] maxLevel:', r.maxLevel)
  console.log('[03] messages:', JSON.stringify(r.messages))

  return { partId }
}
