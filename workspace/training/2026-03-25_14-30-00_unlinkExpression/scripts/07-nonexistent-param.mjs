// Unlink a non-existent param name
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({ id: partId, toCreate: [{ name: 'H', value: 100 }] })
  const boxId = (await api.v1.part.box({
    id: partId, length: 80, width: 60, height: '@expr.H',
  })).result

  const ur = await api.v1.part.unlinkExpression({ id: boxId, name: 'fakeParam' })
  console.log('[07] bad param result:', JSON.stringify(ur.result), 'maxLevel:', ur.maxLevel)
  if (ur.messages?.length) {
    for (const m of ur.messages) console.log('[07] msg:', m.level, m.code, m.message)
  }

  return { partId, boxId }
}
