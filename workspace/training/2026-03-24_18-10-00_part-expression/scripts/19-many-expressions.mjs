// Create a large batch of expressions — what's the practical limit?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  const exprs = []
  for (let i = 0; i < 50; i++) {
    exprs.push({ name: `var${i}`, value: i * 10 })
  }

  const r = await api.v1.part.expression({
    id: partId,
    toCreate: exprs,
  })
  console.log('[19] 50 expressions result:', r.result, 'maxLevel:', r.maxLevel)

  // Check first, middle, last
  const v0 = await api.v1.common.evaluateExpression({ expression: 'var0', id: 6 })
  const v25 = await api.v1.common.evaluateExpression({ expression: 'var25', id: 6 })
  const v49 = await api.v1.common.evaluateExpression({ expression: 'var49', id: 6 })
  console.log('[19] var0 =', v0.result, 'var25 =', v25.result, 'var49 =', v49.result)

  return { partId }
}
