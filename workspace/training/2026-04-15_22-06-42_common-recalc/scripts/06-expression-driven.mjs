// Test recalc interaction with expression-driven features (fixed API signature)
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ExprRecalc' })).result

  // Create expression
  await api.v1.part.expression({ id: partId, toCreate: [{ name: 'W', value: 60 }] })

  // Create box driven by expression
  const boxId = (await api.v1.part.box({ id: partId, length: '@expr.W', width: 40, height: 30 })).result
  console.log('[06] boxId:', boxId)

  // Get initial expression value
  const v1 = (await api.v1.part.getExpression({ id: partId, name: 'W' })).result
  console.log('[06] W before update:', JSON.stringify(v1))

  // Update expression (correct signature: toUpdate array)
  const updateR = await api.v1.part.updateExpression({ id: partId, toUpdate: [{ name: 'W', value: 120 }] })
  console.log('[06] updateExpression result:', updateR.result, 'maxLevel:', updateR.maxLevel)

  const v2 = (await api.v1.part.getExpression({ id: partId, name: 'W' })).result
  console.log('[06] W after updateExpression:', JSON.stringify(v2))

  // Now call recalc explicitly — should have no additional effect
  const r = await api.v1.common.recalc()
  console.log('[06] recalc result:', r.result, 'maxLevel:', r.maxLevel)

  const v3 = (await api.v1.part.getExpression({ id: partId, name: 'W' })).result
  console.log('[06] W after recalc:', JSON.stringify(v3))

  filewrite({
    beforeUpdate: v1,
    afterUpdate: v2,
    afterRecalc: v3,
    updateResult: { result: updateR.result, maxLevel: updateR.maxLevel },
    recalcResult: { result: r.result, maxLevel: r.maxLevel }
  }, 'expression-recalc')

  return { v1, v2, v3 }
}
