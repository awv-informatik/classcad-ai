export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ExprDriven' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const yAxisId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'YAxis' })).result

  // Create expressions
  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'ANG', value: 1.5708 },  // PI/2
      { name: 'ANG2', value: 3.14159 }  // PI
    ]
  })

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [20, 0, 0], endPos: [40, 30, 0]
  })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  // Create revolve with expression-driven angle
  const revId = (await api.v1.part.revolve({
    id: partId, references: [regionId], axisIds: [yAxisId],
    endAngle: '@expr.ANG'
  })).result
  console.log('[07] revolve with expr:', revId)
  await snapshot('before-pi2')

  // Update endAngle to different expression
  await api.v1.part.openFeature({ id: revId })
  const r = await api.v1.part.updateRevolve({ id: revId, endAngle: '@expr.ANG2' })
  console.log('[07] update to ANG2 result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'expr-update-response')
  await api.v1.part.closeFeature({ id: revId })

  await snapshot('after-pi')

  // Now change expression value and see if auto-recalc happens
  await api.v1.part.updateExpression({ id: partId, name: 'ANG2', value: '0.7854' })  // PI/4
  await snapshot('after-expr-change')

  // Verify expression value
  const exprVal = (await api.v1.part.getExpression({ id: partId, name: 'ANG2' })).result
  console.log('[07] ANG2 after update:', JSON.stringify(exprVal))

  return { partId, revId }
}
