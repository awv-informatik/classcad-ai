export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ExprRecalcTest' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'L', value: 50 },
      { name: 'W', value: 30 },
      { name: 'H', value: 20 },
    ],
  })

  const boxId = (await api.v1.part.box({
    id: partId,
    name: 'Box1',
    length: '@expr.L',
    width: '@expr.W',
    height: '@expr.H',
  })).result

  const rBefore = await api.v1.part.calculateMassProperties({ id: partId })
  console.log('[21] before:', JSON.stringify(rBefore.result))

  // Update expressions
  await api.v1.part.updateExpression({ id: partId, name: 'L', value: '100' })
  await api.v1.part.updateExpression({ id: partId, name: 'W', value: '60' })
  await api.v1.part.updateExpression({ id: partId, name: 'H', value: '40' })

  // Without recalc
  const rNoRecalc = await api.v1.part.calculateMassProperties({ id: partId })
  console.log('[21] after update (no recalc):', JSON.stringify(rNoRecalc.result))

  // With explicit recalc
  await api.v1.common.recalc({})
  const rRecalc = await api.v1.part.calculateMassProperties({ id: partId })
  console.log('[21] after recalc:', JSON.stringify(rRecalc.result))

  filewrite({
    before: rBefore.result,
    afterNoRecalc: rNoRecalc.result,
    afterRecalc: rRecalc.result,
  }, 'expression-recalc')

  console.log('[21] expected after: vol=240000, cog=[50,30,20]')

  return { partId }
}
