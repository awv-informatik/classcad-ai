// Test dimension with expression values and updateDimension with expressions
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DimTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create an expression first (correct API: part.updateExpression)
  const exprR = await api.v1.part.updateExpression({ id: partId, name: 'myWidth', value: 60 })
  console.log('[15] updateExpression result:', exprR.result, 'maxLevel:', exprR.maxLevel)
  console.log('[15] updateExpression messages:', JSON.stringify(exprR.messages))

  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result

  // Create dimension with expression reference
  const r1 = await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [rectIds[0]], value: '@expr.myWidth' })
  console.log('[15] dim with expr result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[15] dim with expr messages:', JSON.stringify(r1.messages))

  // updateDimension with numeric value
  const r2 = await api.v1.sketch.updateDimension({ id: r1.result, value: 42 })
  console.log('[15] updateDim numeric result:', r2.result, 'maxLevel:', r2.maxLevel)

  // updateDimension with expression
  const r3 = await api.v1.sketch.updateDimension({ id: r1.result, value: '@expr.myWidth' })
  console.log('[15] updateDim expr result:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[15] updateDim expr messages:', JSON.stringify(r3.messages))

  filewrite({
    exprSetup: { result: exprR.result, maxLevel: exprR.maxLevel, messages: exprR.messages },
    dimWithExpr: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    updateNumeric: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    updateExpr: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
  }, 'expression-responses')

  await snapshot('expression-dims')
  return { partId, skId }
}
