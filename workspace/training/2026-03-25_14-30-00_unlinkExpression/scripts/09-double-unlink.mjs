// Double unlink — unlink twice
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({ id: partId, toCreate: [{ name: 'H', value: 100 }] })
  const boxId = (await api.v1.part.box({
    id: partId, length: 80, width: 60, height: '@expr.H',
  })).result

  const r1 = await api.v1.part.unlinkExpression({ id: boxId, name: 'height' })
  console.log('[09] first unlink:', JSON.stringify(r1.result), 'maxLevel:', r1.maxLevel)

  const r2 = await api.v1.part.unlinkExpression({ id: boxId, name: 'height' })
  console.log('[09] second unlink:', JSON.stringify(r2.result), 'maxLevel:', r2.maxLevel)
  if (r2.messages?.length) {
    for (const m of r2.messages) console.log('[09] msg:', m.level, m.code, m.message)
  }

  return { partId, boxId }
}
