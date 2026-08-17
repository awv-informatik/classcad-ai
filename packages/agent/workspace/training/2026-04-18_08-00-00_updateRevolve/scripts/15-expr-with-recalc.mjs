export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ExprRecalc' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const yAxisId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'YAxis' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'ANG', value: 3.14159 }]
  })

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [20, 0, 0], endPos: [40, 30, 0]
  })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  // Create revolve WITH @expr binding at creation time
  const revId = (await api.v1.part.revolve({
    id: partId, references: [regionId], axisIds: [yAxisId],
    endAngle: '@expr.ANG'
  })).result
  console.log('[15] revolve created:', revId, '(bound to ANG=PI → half ring)')
  await snapshot('initial-half')

  // Update expression correctly
  await api.v1.part.updateExpression({
    id: partId, toUpdate: [{ name: 'ANG', value: 0.7854 }]
  })

  // Verify expression changed
  const exprAfter = (await api.v1.part.getExpression({ id: partId, name: 'ANG' })).result
  console.log('[15] ANG after updateExpression:', JSON.stringify(exprAfter))

  await snapshot('after-updateExpr-no-recalc')

  // Now try explicit recalc
  const recR = await api.v1.common.recalc({})
  console.log('[15] recalc result:', recR.result, 'maxLevel:', recR.maxLevel)

  await snapshot('after-recalc')

  return { partId, revId }
}
