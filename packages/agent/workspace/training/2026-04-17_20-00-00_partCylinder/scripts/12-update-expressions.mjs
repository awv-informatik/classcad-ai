export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CylUpdExpr' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'D', value: 40 },
      { name: 'H', value: 60 },
    ],
  })

  // Create with numeric values
  const cylId = (await api.v1.part.cylinder({ id: partId, name: 'Cyl1', diameter: 60, height: 80 })).result
  await api.v1.part.box({ id: partId, name: 'RefBox', length: 30, width: 30, height: 30 })
  await snapshot('before-expr-update')

  // Update to expression-driven via openFeature
  await api.v1.part.openFeature({ id: cylId })
  const r = await api.v1.part.updateCylinder({ id: cylId, diameter: '@expr.D', height: '@expr.H' })
  console.log('[12] expr update result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'expr-update')
  await api.v1.part.closeFeature({ id: cylId })
  await snapshot('after-expr-update')

  // Now update expression and recalc
  await api.v1.part.updateExpression({ id: partId, name: 'D', value: '120' })
  await api.v1.part.updateExpression({ id: partId, name: 'H', value: '200' })
  await api.v1.common.recalc({})
  await snapshot('after-expr-change')

  return { partId, cylId }
}
