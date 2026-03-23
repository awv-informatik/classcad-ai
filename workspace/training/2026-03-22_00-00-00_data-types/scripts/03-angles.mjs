// Q: Are angles universally radians? Test with workCSys rotation and evaluateExpression
export default async function ({ execute }, { snapshot }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'Test' }] })).result

  // 1. Create a box at origin for reference
  const boxId = (await execute({
    'v1.part.box': [{ id: partId, xLen: 80, yLen: 40, zLen: 20 }]
  })).result
  console.log('[03] boxId:', boxId)

  await snapshot('before-rotation')

  // 2. workCSys with rotation in radians (PI/2 ≈ 1.5708 around Z)
  const wcs1 = await execute({
    'v1.part.workCSys': [{
      id: partId,
      type: 'CUSTOM',
      rotation: [0, 0, Math.PI / 2]
    }]
  })
  console.log('[03] workCSys rotation PI/2 radians:', wcs1.maxLevel <= 31 ? '✓' : '❌', 'wcsId:', wcs1.result)

  // 3. evaluateExpression with trig — confirm radians
  const sinHalf = await execute({
    'v1.common.evaluateExpression': [{ expression: 'sin(C:PI/2)' }]
  })
  console.log('[03] sin(PI/2) =', sinHalf.result, '(should be 1)')

  const sinDeg90 = await execute({
    'v1.common.evaluateExpression': [{ expression: 'sin(90)' }]
  })
  console.log('[03] sin(90) =', sinDeg90.result, '(if radians: ~0.894, if degrees: 1)')

  const cos60 = await execute({
    'v1.common.evaluateExpression': [{ expression: 'cos(C:PI/3)' }]
  })
  console.log('[03] cos(PI/3) =', cos60.result, '(should be 0.5)')

  // 4. Test the deg suffix in expressions — docs show '45deg' in workPlane angle
  const degExpr = await execute({
    'v1.common.evaluateExpression': [{ expression: '45deg' }]
  })
  console.log('[03] 45deg expr:', degExpr.result, 'maxLevel:', degExpr.maxLevel)

  const degExpr2 = await execute({
    'v1.common.evaluateExpression': [{ expression: 'sin(90deg)' }]
  })
  console.log('[03] sin(90deg):', degExpr2.result, 'maxLevel:', degExpr2.maxLevel)

  // 5. Expression constant C:PI
  const piVal = await execute({
    'v1.common.evaluateExpression': [{ expression: 'C:PI' }]
  })
  console.log('[03] C:PI =', piVal.result)

  // 6. atan2 — does it exist?
  const atan = await execute({
    'v1.common.evaluateExpression': [{ expression: 'atan2(1, 1)' }]
  })
  console.log('[03] atan2(1,1):', atan.result, 'maxLevel:', atan.maxLevel)
  if (atan.maxLevel > 31) console.log('[03] atan2 error:', atan.messages.map(m => m.message).join('; '))

  const atan1 = await execute({
    'v1.common.evaluateExpression': [{ expression: 'atan(1)' }]
  })
  console.log('[03] atan(1):', atan1.result, '(should be PI/4 ≈ 0.7854)')

  return { partId, boxId }
}
