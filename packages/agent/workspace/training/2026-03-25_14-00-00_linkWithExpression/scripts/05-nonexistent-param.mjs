// Link to a non-existent feature parameter name
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({ id: partId, toCreate: [{ name: 'H', value: 100 }] })

  const boxId = (await api.v1.part.box({
    id: partId, length: 80, width: 60, height: 40,
  })).result

  const lr = await api.v1.part.linkWithExpression({ id: boxId, exprName: 'H', name: 'fakeParam' })
  console.log('[05] bad param result:', JSON.stringify(lr.result), 'maxLevel:', lr.maxLevel)
  if (lr.messages?.length) {
    for (const m of lr.messages) console.log('[05] msg:', m.level, m.code, m.message)
  }

  return { partId, boxId }
}
