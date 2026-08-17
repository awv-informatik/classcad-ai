// Test if order matters: can a later expression in toCreate reference an earlier one AND vice versa?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Forward reference: 'x' references 'y' which is defined AFTER 'x' in the array
  const r = await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'x', value: 'y * 2' },
      { name: 'y', value: 10 },
    ],
  })
  console.log('[15] forward ref result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[15] messages:', JSON.stringify(r.messages))

  if (r.result === 1) {
    const vx = await api.v1.common.evaluateExpression({ expression: 'x', id: 6 })
    const vy = await api.v1.common.evaluateExpression({ expression: 'y', id: 6 })
    console.log('[15] x =', vx.result, '(expect 20)')
    console.log('[15] y =', vy.result, '(expect 10)')
  }

  return { partId }
}
