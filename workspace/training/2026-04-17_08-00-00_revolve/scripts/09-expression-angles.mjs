export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ExprAngles' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const yAxisId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'YAxis' })).result

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [20, 0, 0], endPos: [40, 30, 0]
  })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  // Create named expression for angle
  await api.v1.part.expression({ id: partId, toCreate: [{ name: 'ANG', value: 1.5708 }] })

  // Use expression string for endAngle
  const r1 = await api.v1.part.revolve({
    id: partId,
    name: 'ExprRevolve',
    references: [regionId],
    axisIds: [yAxisId],
    endAngle: '@expr.ANG'
  })
  console.log('[09] expression angle:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[09] messages:', JSON.stringify(r1.messages))
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'expression-angle-response')

  // Also try inline expression string (no named expression)
  const partId2 = (await api.v1.part.create({ name: 'InlineExpr' })).result
  const topId2 = (await api.v1.part.getWorkGeometry({ id: partId2, name: 'Top' })).result
  const yAxisId2 = (await api.v1.part.getWorkGeometry({ id: partId2, name: 'YAxis' })).result
  const skId2 = (await api.v1.sketch.create({ id: partId2, planeId: topId2 })).result
  const rectIds2 = (await api.v1.sketch.rectangle({
    id: skId2, startPos: [20, 0, 0], endPos: [40, 30, 0]
  })).result
  const regionId2 = (await api.v1.sketch.sketchRegion({ id: skId2, geomIds: rectIds2 })).result

  const r2 = await api.v1.part.revolve({
    id: partId2,
    name: 'InlineRevolve',
    references: [regionId2],
    axisIds: [yAxisId2],
    endAngle: '3.14159/2'
  })
  console.log('[09] inline expr:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[09] inline msgs:', JSON.stringify(r2.messages))

  filewrite({
    namedExpr: { result: r1.result, maxLevel: r1.maxLevel },
    inlineExpr: { result: r2.result, maxLevel: r2.maxLevel }
  }, 'expression-comparison')

  if (r1.result) await snapshot('expr-angle')

  return { partId }
}
