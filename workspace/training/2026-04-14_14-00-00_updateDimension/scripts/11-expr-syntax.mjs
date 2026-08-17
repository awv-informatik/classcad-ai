// Test different expression syntax in updateDimension value
// Try: bare name, with @expr., formula referencing expression
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'ExprSyntax' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  await api.v1.part.expression({ id: partId, name: 'myLen', value: 150 })

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result
  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [80, 0, 0] })).result
  const pts = (await api.v1.sketch.getPoints({ id: lineId })).result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [pts.startId] })

  const dimId = (await api.v1.sketch.dimension({ id: skId, name: 'len', type: 'OFFSET', geomIds: [lineId] })).result

  const results = {}

  // Test 1: bare expression name 'myLen'
  const u1 = await api.v1.sketch.updateDimension({ id: dimId, value: 'myLen' })
  const p1 = (await api.v1.sketch.getPositions({ id: lineId })).result
  results.bareName = { result: u1.result, maxLevel: u1.maxLevel, messages: u1.messages, endX: p1.endPos.x }
  console.log('[11] bare "myLen":', u1.result, u1.maxLevel, 'endX:', p1.endPos.x)

  // Reset
  await api.v1.sketch.updateDimension({ id: dimId, value: 80 })

  // Test 2: @expr.myLen
  const u2 = await api.v1.sketch.updateDimension({ id: dimId, value: '@expr.myLen' })
  const p2 = (await api.v1.sketch.getPositions({ id: lineId })).result
  results.atExpr = { result: u2.result, maxLevel: u2.maxLevel, messages: u2.messages, endX: p2.endPos.x }
  console.log('[11] "@expr.myLen":', u2.result, u2.maxLevel, 'endX:', p2.endPos.x)

  // Reset
  await api.v1.sketch.updateDimension({ id: dimId, value: 80 })

  // Test 3: formula that references expression name 'myLen + 10'
  const u3 = await api.v1.sketch.updateDimension({ id: dimId, value: 'myLen + 10' })
  const p3 = (await api.v1.sketch.getPositions({ id: lineId })).result
  results.formulaRef = { result: u3.result, maxLevel: u3.maxLevel, messages: u3.messages, endX: p3.endPos.x }
  console.log('[11] "myLen + 10":', u3.result, u3.maxLevel, 'endX:', p3.endPos.x)

  // Reset
  await api.v1.sketch.updateDimension({ id: dimId, value: 80 })

  // Test 4: expression with $ prefix?
  const u4 = await api.v1.sketch.updateDimension({ id: dimId, value: '$myLen' })
  const p4 = (await api.v1.sketch.getPositions({ id: lineId })).result
  results.dollarPrefix = { result: u4.result, maxLevel: u4.maxLevel, messages: u4.messages, endX: p4.endPos.x }
  console.log('[11] "$myLen":', u4.result, u4.maxLevel, 'endX:', p4.endPos.x)

  filewrite(results, 'expr-syntax-data')
  return { partId }
}
