// Test: does updateDimension work without open/close feature?
// Also test linkWithExpression as alternative to @expr.NAME
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'FeatureState' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  // Create expression
  await api.v1.part.expression({ id: partId, name: 'myLen', value: 150 })

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result
  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [80, 0, 0] })).result
  const pts = (await api.v1.sketch.getPoints({ id: lineId })).result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [pts.startId] })

  const dimId = (await api.v1.sketch.dimension({ id: skId, name: 'len', type: 'OFFSET', geomIds: [lineId] })).result

  // Test 1: update WITHOUT open/close (should work — API docs don't mention needing it)
  const u1 = await api.v1.sketch.updateDimension({ id: dimId, value: 100 })
  const p1 = (await api.v1.sketch.getPositions({ id: lineId })).result
  console.log('[09] without open/close: result:', u1.result, 'endX:', p1.endPos.x)

  // Test 2: try linkWithExpression to bind dimension to expression
  const linkR = await api.v1.part.linkWithExpression({ id: dimId, paramName: 'value', expression: 'myLen' })
  console.log('[09] linkWithExpression result:', linkR.result, 'maxLevel:', linkR.maxLevel)
  console.log('[09] linkWithExpression messages:', JSON.stringify(linkR.messages))

  const p2 = (await api.v1.sketch.getPositions({ id: lineId })).result
  console.log('[09] after link: endX:', p2.endPos.x) // should be 150 if link worked

  // Now update the expression to 200
  await api.v1.part.updateExpression({ id: partId, name: 'myLen', value: 200 })
  const p3 = (await api.v1.sketch.getPositions({ id: lineId })).result
  console.log('[09] after expr update to 200: endX:', p3.endPos.x)

  // Update expression to 80
  await api.v1.part.updateExpression({ id: partId, name: 'myLen', value: 80 })
  const p4 = (await api.v1.sketch.getPositions({ id: lineId })).result
  console.log('[09] after expr update to 80: endX:', p4.endPos.x)

  await snapshot('result')

  filewrite({
    withoutOpenClose: { result: u1.result, endX: p1.endPos.x },
    linkWithExpression: { result: linkR.result, maxLevel: linkR.maxLevel, messages: linkR.messages },
    afterLink: { endX: p2.endPos.x },
    afterExprUpdate200: { endX: p3.endPos.x },
    afterExprUpdate80: { endX: p4.endPos.x },
  }, 'feature-state-data')

  return { partId }
}
