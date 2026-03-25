// Wrong form: direct name instead of toDelete array
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({ id: partId, toCreate: [{ name: 'x', value: 50 }] })

  // Wrong: direct name param
  const r1 = await api.v1.part.deleteExpression({ id: partId, name: 'x' })
  console.log('[07] wrong form (name) result:', r1.result, 'maxLevel:', r1.maxLevel)

  const check1 = await api.v1.part.getExpression({ id: partId, name: 'x' })
  console.log('[07] x after wrong form:', check1.result.value)

  // Wrong: toDelete as string instead of array
  const r2 = await api.v1.part.deleteExpression({ id: partId, toDelete: 'x' })
  console.log('[07] wrong form (string) result:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages?.length) {
    for (const m of r2.messages) console.log('[07] msg:', m.level, m.code, m.message)
  }

  const check2 = await api.v1.part.getExpression({ id: partId, name: 'x' })
  console.log('[07] x after string form:', check2.result.value)

  return { partId }
}
