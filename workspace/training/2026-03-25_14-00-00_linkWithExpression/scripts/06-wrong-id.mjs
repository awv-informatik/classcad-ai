// Use part ID instead of feature ID
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({ id: partId, toCreate: [{ name: 'H', value: 100 }] })
  await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })

  // Wrong: passing partId instead of boxId
  const lr = await api.v1.part.linkWithExpression({ id: partId, exprName: 'H', name: 'height' })
  console.log('[06] part ID result:', JSON.stringify(lr.result), 'maxLevel:', lr.maxLevel)
  if (lr.messages?.length) {
    for (const m of lr.messages) console.log('[06] msg:', m.level, m.code, m.message)
  }

  return { partId }
}
