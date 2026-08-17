export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ExprAutoRecalcFixed' })).result
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

  // Create revolve bound to expression
  const revId = (await api.v1.part.revolve({
    id: partId, references: [regionId], axisIds: [yAxisId],
    endAngle: '@expr.SWEEP'
  })).result
  console.log('[14] revolve created:', revId, '(bound to SWEEP=PI)')
  await snapshot('initial-half')

  // Update expression using CORRECT toUpdate array form
  const updateR = await api.v1.part.updateExpression({
    id: partId,
    toUpdate: [{ name: 'SWEEP', value: 1.5708 }]
  })
  console.log('[14] updateExpression result:', updateR.result, 'maxLevel:', updateR.maxLevel)

  // Verify expression value changed
  const exprVal = (await api.v1.part.getExpression({ id: partId, name: 'SWEEP' })).result
  console.log('[14] SWEEP after update:', JSON.stringify(exprVal))

  await snapshot('after-expr-quarter')

  return { partId, revId }
}
