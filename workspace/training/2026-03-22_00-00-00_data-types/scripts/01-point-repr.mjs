// Q: How do points look in params vs results? Is {x,y,z} accepted as param?
export default async function ({ execute }) {
  // 1. evaluateExpression returns a point — what format?
  const r1 = await execute({ 'v1.common.evaluateExpression': [{ expression: '{10, 20, 30}' }] })
  console.log('[01] expr point result:', JSON.stringify(r1.result))
  console.log('[01] expr point type:', typeof r1.result, Array.isArray(r1.result))

  // 2. Create a part so we have objects to test with
  const partId = (await execute({ 'v1.part.create': [{ name: 'Test' }] })).result

  // 3. setObjectCoordSystem — docs show origin/xVec/yVec as point type
  // Try with [x,y,z] array format
  const r2 = await execute({
    'v1.common.setObjectCoordSystem': [{
      id: partId,
      origin: [10, 20, 30],
      xVec: [1, 0, 0],
      yVec: [0, 1, 0]
    }]
  })
  console.log('[01] setCoordSys array format:', r2.maxLevel <= 31 ? '✓' : '❌', 'maxLevel:', r2.maxLevel)

  // 4. Try with {x,y,z} object format
  const r3 = await execute({
    'v1.common.setObjectCoordSystem': [{
      id: partId,
      origin: { x: 50, y: 60, z: 70 },
      xVec: { x: 1, y: 0, z: 0 },
      yVec: { x: 0, y: 1, z: 0 }
    }]
  })
  console.log('[01] setCoordSys object format:', r3.maxLevel <= 31 ? '✓' : '❌', 'maxLevel:', r3.maxLevel)

  // 5. Point arithmetic in expressions
  const r4 = await execute({
    'v1.common.evaluateExpression': [{ expression: '{1,2,3} + {4,5,6}' }]
  })
  console.log('[01] point addition:', JSON.stringify(r4.result))

  const r5 = await execute({
    'v1.common.evaluateExpression': [{ expression: '{1,2,3} * 3' }]
  })
  console.log('[01] point scalar mult:', JSON.stringify(r5.result))

  return { partId }
}
