export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ExprDebug' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'L', value: 50 }],
  })

  const boxId = (await api.v1.part.box({
    id: partId,
    name: 'Box1',
    length: '@expr.L',
    width: 30,
    height: 20,
  })).result

  // Check initial state
  const r1 = await api.v1.part.calculateMassProperties({ id: partId })
  const e1 = (await api.v1.part.getExpression({ id: partId, name: 'L' })).result
  console.log('[22] initial: vol=', r1.result?.volume, 'L=', JSON.stringify(e1))

  // Update expression
  await api.v1.part.updateExpression({ id: partId, name: 'L', value: '100' })
  const e2 = (await api.v1.part.getExpression({ id: partId, name: 'L' })).result
  console.log('[22] after updateExpr: L=', JSON.stringify(e2))

  // Check mass props immediately
  const r2 = await api.v1.part.calculateMassProperties({ id: partId })
  console.log('[22] after updateExpr: vol=', r2.result?.volume)

  // Recalc
  await api.v1.common.recalc({})
  const r3 = await api.v1.part.calculateMassProperties({ id: partId })
  console.log('[22] after recalc: vol=', r3.result?.volume)

  // Try open/close on box
  await api.v1.part.openFeature({ id: boxId })
  await api.v1.part.closeFeature({ id: boxId })
  const r4 = await api.v1.part.calculateMassProperties({ id: partId })
  console.log('[22] after open/close: vol=', r4.result?.volume)

  // Recalc again
  await api.v1.common.recalc({})
  const r5 = await api.v1.part.calculateMassProperties({ id: partId })
  console.log('[22] after recalc 2: vol=', r5.result?.volume)

  filewrite({
    initial: { vol: r1.result?.volume, expr: e1 },
    afterUpdate: { vol: r2.result?.volume, expr: e2 },
    afterRecalc: { vol: r3.result?.volume },
    afterOpenClose: { vol: r4.result?.volume },
    afterRecalc2: { vol: r5.result?.volume },
  }, 'expression-debug')

  // Expected: initial=50*30*20=30000, after=100*30*20=60000
  console.log('[22] expected initial: 30000, after: 60000')

  return { partId }
}
