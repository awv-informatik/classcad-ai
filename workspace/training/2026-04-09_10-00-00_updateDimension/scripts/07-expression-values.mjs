// 07 — Expression values: valid expression, non-existent expression, various expression formats
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create a named expression first
  await api.v1.part.updateExpression({ id: partId, name: 'myWidth', value: 75 })
  await api.v1.part.updateExpression({ id: partId, name: 'myAngle', value: 0.785 })

  const skId = (await api.v1.sketch.create({ id: partId })).result
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [80, 0, 0] })).result
  const dimId = (await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [l1] })).result
  console.log('[07] dimId:', dimId)

  // Test 1: Valid expression reference
  const r1 = await api.v1.sketch.updateDimension({ id: dimId, value: '@expr.myWidth' })
  console.log('[07] valid expr result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'valid-expr')

  // Test 2: Non-existent expression
  const r2 = await api.v1.sketch.updateDimension({ id: dimId, value: '@expr.doesNotExist' })
  console.log('[07] nonexist expr result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'nonexist-expr')

  // Test 3: Just '@' — malformed expression
  const r3 = await api.v1.sketch.updateDimension({ id: dimId, value: '@' })
  console.log('[07] bare-at result:', r3.result, 'maxLevel:', r3.maxLevel)
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'bare-at')

  // Test 4: Expression with math like '@expr.myWidth * 2'
  const r4 = await api.v1.sketch.updateDimension({ id: dimId, value: '@expr.myWidth * 2' })
  console.log('[07] expr-math result:', r4.result, 'maxLevel:', r4.maxLevel)
  filewrite({ result: r4.result, messages: r4.messages, maxLevel: r4.maxLevel }, 'expr-math')

  // Test 5: String that's not an expression (e.g. 'hello')
  const r5 = await api.v1.sketch.updateDimension({ id: dimId, value: 'hello' })
  console.log('[07] string result:', r5.result, 'maxLevel:', r5.maxLevel)
  filewrite({ result: r5.result, messages: r5.messages, maxLevel: r5.maxLevel }, 'string-value')

  // Test 6: Numeric string '50'
  const r6 = await api.v1.sketch.updateDimension({ id: dimId, value: '50' })
  console.log('[07] numeric-string result:', r6.result, 'maxLevel:', r6.maxLevel)
  filewrite({ result: r6.result, messages: r6.messages, maxLevel: r6.maxLevel }, 'numeric-string')

  return { partId }
}
