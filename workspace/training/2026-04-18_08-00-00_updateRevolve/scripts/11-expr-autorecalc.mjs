export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ExprAutoRecalc' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const yAxisId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'YAxis' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'SWEEP', value: 3.14159 }]
  })

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [20, 0, 0], endPos: [40, 30, 0]
  })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  // Create revolve bound to expression via updateRevolve
  const revId = (await api.v1.part.revolve({
    id: partId, references: [regionId], axisIds: [yAxisId],
    endAngle: Math.PI / 2
  })).result
  console.log('[11] revolve created:', revId)
  await snapshot('initial-quarter')

  // Update to use expression
  await api.v1.part.openFeature({ id: revId })
  const r1 = await api.v1.part.updateRevolve({ id: revId, endAngle: '@expr.SWEEP' })
  console.log('[11] bind to expr result:', r1.result, 'maxLevel:', r1.maxLevel)
  await api.v1.part.closeFeature({ id: revId })
  await snapshot('bound-to-pi')

  // Now update the expression value — does geometry auto-recalc?
  const updateR = await api.v1.part.updateExpression({ id: partId, name: 'SWEEP', value: 1.5708 })
  console.log('[11] updateExpression result:', updateR.result, 'maxLevel:', updateR.maxLevel)
  console.log('[11] updateExpression messages:', JSON.stringify(updateR.messages))
  filewrite({ result: updateR.result, messages: updateR.messages, maxLevel: updateR.maxLevel }, 'updateExpr-response')

  // Check expression value
  const exprVal = (await api.v1.part.getExpression({ id: partId, name: 'SWEEP' })).result
  console.log('[11] SWEEP value after update:', JSON.stringify(exprVal))

  await snapshot('after-expr-to-quarter')

  return { partId, revId }
}
