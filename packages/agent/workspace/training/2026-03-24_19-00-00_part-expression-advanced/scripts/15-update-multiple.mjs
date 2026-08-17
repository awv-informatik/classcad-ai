// Update multiple expressions in one call via toUpdate array
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'L', value: 100 },
      { name: 'W', value: 60 },
      { name: 'H', value: 40 },
    ],
  })

  const boxId = (await api.v1.part.box({
    id: partId,
    name: 'MyBox',
    length: '@expr.L',
    width: '@expr.W',
    height: '@expr.H',
  })).result

  await snapshot('multi-before')

  // Update all three at once
  const r = await api.v1.part.updateExpression({
    id: partId,
    toUpdate: [
      { name: 'L', value: 200 },
      { name: 'W', value: 120 },
      { name: 'H', value: 80 },
    ],
  })
  console.log('[15] batch update result:', r.result, 'maxLevel:', r.maxLevel)

  await api.v1.common.recalc()

  for (const name of ['L', 'W', 'H']) {
    const v = await api.v1.part.getExpression({ id: partId, name })
    console.log(`[15] ${name} after:`, v.result.value)
  }

  await snapshot('multi-after')
  return { partId, boxId }
}
