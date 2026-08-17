export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UpdateExprTest' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'L', value: 60 },
      { name: 'W', value: 40 },
      { name: 'H', value: 30 },
    ],
  })

  // Create box with plain numbers first
  const refBox = (await api.v1.part.box({ id: partId, name: 'Ref', length: 20, width: 20, height: 20 })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Target', length: 50, width: 50, height: 50 })).result

  await snapshot('before-expr-update')

  // Update to use expressions
  await api.v1.part.openFeature({ id: boxId })
  const ur = await api.v1.part.updateBox({ id: boxId, length: '@expr.L', width: '@expr.W', height: '@expr.H' })
  await api.v1.part.closeFeature({ id: boxId })

  console.log('[14] update to expr - result:', ur.result, 'maxLevel:', ur.maxLevel)
  filewrite({ result: ur.result, messages: ur.messages, maxLevel: ur.maxLevel }, 'update-expr-response')

  await snapshot('after-expr-update')

  // Now update the expression and see if the box changes
  await api.v1.part.updateExpression({ id: partId, name: 'H', value: '100' })
  await api.v1.common.recalc({})

  await snapshot('after-expr-change')
  return { partId, boxId }
}
