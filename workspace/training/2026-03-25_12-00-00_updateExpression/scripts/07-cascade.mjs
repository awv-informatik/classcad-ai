// Test cascade: update base expr → derived expr updates automatically
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'base', value: 10 },
      { name: 'doubled', value: 'base * 2' },
      { name: 'quadrupled', value: 'doubled * 2' },
    ],
  })

  const before = {
    base: (await api.v1.part.getExpression({ id: partId, name: 'base' })).result,
    doubled: (await api.v1.part.getExpression({ id: partId, name: 'doubled' })).result,
    quadrupled: (await api.v1.part.getExpression({ id: partId, name: 'quadrupled' })).result,
  }
  console.log('[07] before:', JSON.stringify(before))

  // Update base only
  await api.v1.part.updateExpression({
    id: partId,
    toUpdate: [{ name: 'base', value: 100 }],
  })

  const after = {
    base: (await api.v1.part.getExpression({ id: partId, name: 'base' })).result,
    doubled: (await api.v1.part.getExpression({ id: partId, name: 'doubled' })).result,
    quadrupled: (await api.v1.part.getExpression({ id: partId, name: 'quadrupled' })).result,
  }
  console.log('[07] after:', JSON.stringify(after))
  console.log('[07] cascade ok?', after.doubled.value === 200 && after.quadrupled.value === 400)

  return { partId }
}
