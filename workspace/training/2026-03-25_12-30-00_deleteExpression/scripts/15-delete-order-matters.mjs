// Does delete order matter when expressions reference each other?
// Delete derived BEFORE base vs base BEFORE derived
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Test 1: delete derived first, then base
  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'base1', value: 10 },
      { name: 'derived1', value: 'base1 * 2' },
    ],
  })
  const dr1 = await api.v1.part.deleteExpression({
    id: partId,
    toDelete: ['derived1', 'base1'],
  })
  console.log('[15] derived-first result:', dr1.result, 'maxLevel:', dr1.maxLevel)

  // Test 2: delete base first, then derived (base is still referenced)
  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'base2', value: 10 },
      { name: 'derived2', value: 'base2 * 2' },
    ],
  })
  const dr2 = await api.v1.part.deleteExpression({
    id: partId,
    toDelete: ['base2', 'derived2'],
  })
  console.log('[15] base-first result:', dr2.result, 'maxLevel:', dr2.maxLevel)
  if (dr2.messages?.length) {
    for (const m of dr2.messages) console.log('[15] msg:', m.level, m.code, m.message)
  }

  // Both should be gone
  const rb = await api.v1.part.getExpression({ id: partId, name: 'base2' })
  const rd = await api.v1.part.getExpression({ id: partId, name: 'derived2' })
  console.log('[15] base2:', rb.result.value, 'derived2:', rd.result.value)

  return { partId }
}
