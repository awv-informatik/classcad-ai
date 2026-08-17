// 12 — Verify dimension value is stored in structure tree after update
// Check that the paramName in structure tree reflects the stored value
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [80, 0, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [0, 40, 0], endPos: [80, 40, 0] })).result

  // Create named dimension with auto value (should be 40)
  const dimId = (await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [l1, l2], name: 'testDim' })).result
  console.log('[12] dimId:', dimId)

  // Get structure BEFORE update
  const beforeR = await api.v1.sketch.updateDimension({ id: dimId, value: 40 }) // keep same value
  // Use part.getExpression to read the dimension's expression parameter
  const exprBefore = await api.v1.part.getExpression({ id: partId, name: 'testDim' })
  console.log('[12] expr before:', JSON.stringify(exprBefore.result), 'maxLevel:', exprBefore.maxLevel)
  filewrite({ result: exprBefore.result, messages: exprBefore.messages, maxLevel: exprBefore.maxLevel }, 'expr-before')

  // Update to 75
  await api.v1.sketch.updateDimension({ id: dimId, value: 75 })

  const exprAfter = await api.v1.part.getExpression({ id: partId, name: 'testDim' })
  console.log('[12] expr after:', JSON.stringify(exprAfter.result), 'maxLevel:', exprAfter.maxLevel)
  filewrite({ result: exprAfter.result, messages: exprAfter.messages, maxLevel: exprAfter.maxLevel }, 'expr-after')

  // Update with expression
  await api.v1.part.updateExpression({ id: partId, name: 'myVar', value: 123 })
  await api.v1.sketch.updateDimension({ id: dimId, value: '@expr.myVar' })

  const exprLinked = await api.v1.part.getExpression({ id: partId, name: 'testDim' })
  console.log('[12] expr linked:', JSON.stringify(exprLinked.result), 'maxLevel:', exprLinked.maxLevel)
  filewrite({ result: exprLinked.result, messages: exprLinked.messages, maxLevel: exprLinked.maxLevel }, 'expr-linked')

  return { partId }
}
