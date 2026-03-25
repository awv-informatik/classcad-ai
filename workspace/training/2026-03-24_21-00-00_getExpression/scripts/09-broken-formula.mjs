// Get expression that has a broken formula (references undefined var)
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create expression with bad ref — from prior training, this registers with value=1
  const cr = await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'broken', value: 'undefinedVar + 5' }],
  })
  console.log('[09] create result:', cr.result, 'maxLevel:', cr.maxLevel)

  const r = await api.v1.part.getExpression({ id: partId, name: 'broken' })
  console.log('[09] broken expr result:', JSON.stringify(r.result))
  console.log('[09] broken maxLevel:', r.maxLevel)
  console.log('[09] broken messages:', JSON.stringify(r.messages?.map(m => m.message)))

  return { partId }
}
