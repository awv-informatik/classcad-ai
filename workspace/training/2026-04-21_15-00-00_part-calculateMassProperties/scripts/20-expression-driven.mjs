export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ExprTest' })).result

  // Create expression-driven box
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

  // Before expression update
  const rBefore = await api.v1.part.calculateMassProperties({ id: partId })
  console.log('[20] before:', JSON.stringify(rBefore.result))

  // Update expressions to double all dimensions
  await api.v1.part.updateExpression({ id: partId, name: 'L', value: '100' })
  await api.v1.part.updateExpression({ id: partId, name: 'W', value: '60' })
  await api.v1.part.updateExpression({ id: partId, name: 'H', value: '40' })

  // After expression update (should auto-recalc)
  const rAfter = await api.v1.part.calculateMassProperties({ id: partId })
  console.log('[20] after:', JSON.stringify(rAfter.result))

  filewrite({
    before: rBefore.result,
    after: rAfter.result,
  }, 'expression-driven')

  console.log('[20] expected before: vol=30000, cog=[25,15,10]')
  console.log('[20] expected after: vol=240000, cog=[50,30,20]')

  return { partId }
}
