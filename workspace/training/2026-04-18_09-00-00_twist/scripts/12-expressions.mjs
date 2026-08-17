export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ExprTwist' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result

  // Create expressions
  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'H', value: 100 },
      { name: 'A', value: '3.14159/2' },
    ],
  })

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [-25, -15, 0], endPos: [25, 15, 0]
  })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  // Use expressions in twist params
  const r1 = await api.v1.part.twist({
    id: partId, name: 'ExprTwist', references: [regionId],
    twistAngle: '@expr.A',
    limit2: '@expr.H',
  })
  console.log('[12] expr twist:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'expr-response')
  await snapshot('expr-twist')

  // Update the expression to change the twist
  await api.v1.part.updateExpression({ id: partId, name: 'A', value: '3.14159' })
  await api.v1.common.recalc({})
  await snapshot('expr-twist-updated')

  return { partId }
}
