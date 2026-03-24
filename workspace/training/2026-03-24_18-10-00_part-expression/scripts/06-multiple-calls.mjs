// Can we call expression() multiple times to add more expressions?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  const r1 = await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'a', value: 10 }],
  })
  console.log('[06] first call result:', r1.result, 'maxLevel:', r1.maxLevel)

  const r2 = await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'b', value: 20 }],
  })
  console.log('[06] second call result:', r2.result, 'maxLevel:', r2.maxLevel)

  // Can second-call expression reference first-call expression?
  const r3 = await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'c', value: 'a + b' }],
  })
  console.log('[06] third call result:', r3.result, 'maxLevel:', r3.maxLevel)

  const v = await api.v1.common.evaluateExpression({ expression: 'c', id: 6 })
  console.log('[06] c =', v.result)

  return { partId, c: v.result }
}
