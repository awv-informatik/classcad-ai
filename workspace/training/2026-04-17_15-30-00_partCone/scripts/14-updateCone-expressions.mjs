export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ConeUpdExpr' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'BD', value: 60 },
      { name: 'TD', value: 15 },
      { name: 'H', value: 100 },
    ],
  })

  // Reference box
  await api.v1.part.box({ id: partId, name: 'RefBox', length: 20, width: 20, height: 20 })

  const coneId = (await api.v1.part.cone({
    id: partId, name: 'ExprUpdCone', bDiameter: 40, tDiameter: 10, height: 60,
  })).result

  await snapshot('before-expr-update')

  // Update to expression-driven dims
  await api.v1.part.openFeature({ id: coneId })
  const r = await api.v1.part.updateCone({
    id: coneId,
    bDiameter: '@expr.BD',
    tDiameter: '@expr.TD',
    height: '@expr.H',
  })
  await api.v1.part.closeFeature({ id: coneId })

  console.log('[14] expr update result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'expr-update-response')

  await snapshot('after-expr-update')

  // Now change the expression and recalc
  await api.v1.part.updateExpression({ id: partId, name: 'BD', value: '120' })
  await api.v1.part.updateExpression({ id: partId, name: 'H', value: '200' })
  await api.v1.common.recalc({})

  await snapshot('after-expr-change')

  const bD = (await api.v1.part.getExpression({ id: coneId, name: 'bDiameter' })).result
  const tD = (await api.v1.part.getExpression({ id: coneId, name: 'tDiameter' })).result
  const h = (await api.v1.part.getExpression({ id: coneId, name: 'height' })).result
  console.log('[14] after expr change bD:', bD, 'tD:', tD, 'h:', h)

  filewrite({ bDiameter: bD, tDiameter: tD, height: h }, 'after-expr-change-values')

  return { partId, coneId }
}
