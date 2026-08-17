export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CylExpr' })).result

  // Create named expressions
  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'D', value: 80 },
      { name: 'H', value: 150 },
    ],
  })

  // Create cylinder with @expr. references
  const r1 = await api.v1.part.cylinder({ id: partId, name: 'ExprCyl', diameter: '@expr.D', height: '@expr.H' })
  console.log('[06] expr cylinder result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'expr-response')

  // Also create with inline math
  const r2 = await api.v1.part.cylinder({ id: partId, name: 'MathCyl', diameter: '4*20', height: 'sqrt(10000)' })
  console.log('[06] math cylinder result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'math-response')

  // Create a reference box for scale comparison
  await api.v1.part.box({ id: partId, name: 'RefBox', length: 30, width: 30, height: 30 })

  await snapshot('expressions')

  // Now update the expression and recalc to see if cylinder changes
  await api.v1.part.updateExpression({ id: partId, name: 'D', value: '40' })
  await api.v1.part.updateExpression({ id: partId, name: 'H', value: '60' })
  await api.v1.common.recalc({})

  await snapshot('after-expr-update')
  return { partId, cylId1: r1.result, cylId2: r2.result }
}
