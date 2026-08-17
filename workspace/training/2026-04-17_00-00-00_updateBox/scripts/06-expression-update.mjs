export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create named expressions
  await api.v1.part.expression({ id: partId, name: 'L', value: 60 })
  await api.v1.part.expression({ id: partId, name: 'W', value: 40 })
  await api.v1.part.expression({ id: partId, name: 'H', value: 30 })

  // Create box with numeric values first
  const refBoxId = (await api.v1.part.box({ id: partId, name: 'Ref', length: 20, width: 20, height: 20 })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Target', length: 80, width: 60, height: 40 })).result
  console.log('[06] boxId:', boxId)

  await snapshot('before')

  // Update to use expression references
  await api.v1.part.openFeature({ id: boxId })
  const upR = await api.v1.part.updateBox({ id: boxId, length: '@expr.L', width: '@expr.W', height: '@expr.H' })
  console.log('[06] updateBox(@expr) result:', upR.result, 'maxLevel:', upR.maxLevel)
  filewrite({ result: upR.result, messages: upR.messages, maxLevel: upR.maxLevel }, 'expr-update-response')
  await api.v1.part.closeFeature({ id: boxId })

  await snapshot('after-expr')

  // Now update the expression value and verify box changes
  await api.v1.part.updateExpression({ id: partId, name: 'H', value: 100 })
  await snapshot('after-expr-change')

  return { partId, boxId }
}
