export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ExprTest' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result

  // Create expressions
  await api.v1.part.expression({ id: partId, toCreate: [
    { name: 'H', value: 50 },
    { name: 'T', value: 0.1 },
  ]})

  const sk = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const lines = (await api.v1.sketch.rectangle({ id: sk, startPos: [0, 0, 0], endPos: [60, 40, 0] })).result
  const region = (await api.v1.sketch.sketchRegion({ id: sk, geomIds: lines })).result

  // Extrusion with expression-driven limit2 and taperAngle
  const r = await api.v1.part.extrusion({
    id: partId,
    name: 'ExprExt',
    references: [region],
    limit2: '@expr.H',
    taperAngle: '@expr.T',
  })
  console.log('[07] expr extrusion:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) console.log('[07] msg:', r.messages[0].message)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'expr-extrusion')

  await snapshot('expr-before-update')

  // Now update expression H to 100
  await api.v1.part.updateExpression({ id: partId, toUpdate: [{ name: 'H', value: 100 }] })
  await api.v1.common.recalc({})

  // Verify expression propagated
  const hVal = (await api.v1.part.getExpression({ id: partId, name: 'H' })).result
  console.log('[07] H after update:', hVal)

  await snapshot('expr-after-update')
  return { partId, extId: r.result }
}
