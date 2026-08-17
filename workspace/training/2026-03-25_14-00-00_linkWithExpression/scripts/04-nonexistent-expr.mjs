// Link to a non-existent expression name
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const boxId = (await api.v1.part.box({
    id: partId, length: 80, width: 60, height: 40,
  })).result

  const lr = await api.v1.part.linkWithExpression({ id: boxId, exprName: 'nope', name: 'height' })
  console.log('[04] nonexistent expr result:', JSON.stringify(lr.result), 'maxLevel:', lr.maxLevel)
  if (lr.messages?.length) {
    for (const m of lr.messages) console.log('[04] msg:', m.level, m.code, m.message)
  }

  return { partId, boxId }
}
