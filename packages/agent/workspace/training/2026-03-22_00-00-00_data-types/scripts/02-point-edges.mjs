// Q: Can you use 2D points [x,y]? What about [x,y,z,w]? Empty arrays?
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // 1. Try 2D point [x,y] as coord system origin
  const r1 = await api.v1.common.setObjectCoordSystem({
      id: partId,
      origin: [10, 20],
      xVec: [1, 0, 0],
      yVec: [0, 1, 0]
    })
  console.log('[02] 2D point [x,y]:', r1.maxLevel <= 31 ? '✓' : '❌', 'maxLevel:', r1.maxLevel)
  if (r1.maxLevel > 31) console.log('[02] 2D error:', r1.messages.map(m => m.message).join('; '))

  // 2. Try 4D point [x,y,z,w]
  const r2 = await api.v1.common.setObjectCoordSystem({
      id: partId,
      origin: [10, 20, 30, 40],
      xVec: [1, 0, 0],
      yVec: [0, 1, 0]
    })
  console.log('[02] 4D point [x,y,z,w]:', r2.maxLevel <= 31 ? '✓' : '❌', 'maxLevel:', r2.maxLevel)
  if (r2.maxLevel > 31) console.log('[02] 4D error:', r2.messages.map(m => m.message).join('; '))

  // 3. Try 1D point [x]
  const r3 = await api.v1.common.setObjectCoordSystem({
      id: partId,
      origin: [10],
      xVec: [1, 0, 0],
      yVec: [0, 1, 0]
    })
  console.log('[02] 1D point [x]:', r3.maxLevel <= 31 ? '✓' : '❌', 'maxLevel:', r3.maxLevel)
  if (r3.maxLevel > 31) console.log('[02] 1D error:', r3.messages.map(m => m.message).join('; '))

  // 4. Expression: 2-component point
  const r4 = await api.v1.common.evaluateExpression({ expression: '{10, 20}' })
  console.log('[02] expr 2D {10,20}:', JSON.stringify(r4.result), 'maxLevel:', r4.maxLevel)

  // 5. Empty point []
  const r5 = await api.v1.common.setObjectCoordSystem({
      id: partId,
      origin: [],
      xVec: [1, 0, 0],
      yVec: [0, 1, 0]
    })
  console.log('[02] empty point []:', r5.maxLevel <= 31 ? '✓' : '❌', 'maxLevel:', r5.maxLevel)
  if (r5.maxLevel > 31) console.log('[02] empty error:', r5.messages.map(m => m.message).join('; '))

  // 6. Precision test — very small and very large values
  const r6 = await api.v1.common.evaluateExpression({ expression: '{0.000001, 999999.999999, -123456.789}' })
  console.log('[02] precision:', JSON.stringify(r6.result))

  // 7. Zero vector
  const r7 = await api.v1.common.setObjectCoordSystem({
      id: partId,
      origin: [0, 0, 0],
      xVec: [0, 0, 0],
      yVec: [0, 0, 0]
    })
  console.log('[02] zero xVec/yVec:', r7.maxLevel <= 31 ? '✓' : '❌', 'maxLevel:', r7.maxLevel)
  if (r7.maxLevel > 31) console.log('[02] zero vec error:', r7.messages.map(m => m.message).join('; '))

  return { partId }
}
