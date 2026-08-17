// Get expression before and after updateExpression — does value update immediately?
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'base', value: 50 },
      { name: 'derived', value: 'base * 3' },
    ],
  })

  const before1 = await api.v1.part.getExpression({ id: partId, name: 'base' })
  const before2 = await api.v1.part.getExpression({ id: partId, name: 'derived' })
  console.log('[07] before base:', JSON.stringify(before1.result))
  console.log('[07] before derived:', JSON.stringify(before2.result))

  // Update base
  await api.v1.part.updateExpression({
    id: partId,
    toUpdate: [{ name: 'base', value: 100 }],
  })

  // Before recalc
  const after1 = await api.v1.part.getExpression({ id: partId, name: 'base' })
  const after2 = await api.v1.part.getExpression({ id: partId, name: 'derived' })
  console.log('[07] after update (no recalc) base:', JSON.stringify(after1.result))
  console.log('[07] after update (no recalc) derived:', JSON.stringify(after2.result))

  // After recalc
  await api.v1.common.recalc()
  const recalc1 = await api.v1.part.getExpression({ id: partId, name: 'base' })
  const recalc2 = await api.v1.part.getExpression({ id: partId, name: 'derived' })
  console.log('[07] after recalc base:', JSON.stringify(recalc1.result))
  console.log('[07] after recalc derived:', JSON.stringify(recalc2.result))

  return { partId }
}
