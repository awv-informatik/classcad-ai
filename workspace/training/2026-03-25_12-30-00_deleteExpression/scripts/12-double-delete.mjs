// Delete same name twice in one call
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({ id: partId, toCreate: [{ name: 'x', value: 10 }] })

  const dr = await api.v1.part.deleteExpression({
    id: partId,
    toDelete: ['x', 'x'],
  })
  console.log('[12] double delete result:', dr.result, 'maxLevel:', dr.maxLevel)
  if (dr.messages?.length) {
    for (const m of dr.messages) console.log('[12] msg:', m.level, m.code, m.message)
  }

  const check = await api.v1.part.getExpression({ id: partId, name: 'x' })
  console.log('[12] x after:', check.result.value)

  return { partId }
}
