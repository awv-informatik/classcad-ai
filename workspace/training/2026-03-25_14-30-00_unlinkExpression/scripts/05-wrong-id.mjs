// Wrong id (part ID)
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({ id: partId, toCreate: [{ name: 'H', value: 100 }] })
  await api.v1.part.box({ id: partId, length: 80, width: 60, height: '@expr.H' })

  const ur = await api.v1.part.unlinkExpression({ id: partId, name: 'height' })
  console.log('[05] part ID result:', JSON.stringify(ur.result), 'maxLevel:', ur.maxLevel)
  if (ur.messages?.length) {
    for (const m of ur.messages) console.log('[05] msg:', m.level, m.code, m.message)
  }

  return { partId }
}
