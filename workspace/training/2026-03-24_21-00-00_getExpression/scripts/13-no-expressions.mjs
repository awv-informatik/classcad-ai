// Get expression from a part that has no expressions at all
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  const r = await api.v1.part.getExpression({ id: partId, name: 'anything' })
  console.log('[13] no exprs result:', JSON.stringify(r.result))
  console.log('[13] no exprs maxLevel:', r.maxLevel)
  console.log('[13] no exprs messages:', JSON.stringify(r.messages?.map(m => m.message)))

  return { partId }
}
