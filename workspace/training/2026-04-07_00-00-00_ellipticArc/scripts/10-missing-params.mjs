// Error handling: missing required params
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S1' })).result

  // Missing radius2
  const r1 = await api.v1.curve.ellipticArc({
    id: shapeId, centerPos: [0, 0, 0],
    startAngle: 0, endAngle: Math.PI, radius1: 20,
  })
  console.log('[10] missing radius2:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[10] messages:', JSON.stringify(r1.messages))

  // Missing startAngle
  const r2 = await api.v1.curve.ellipticArc({
    id: shapeId, centerPos: [0, 0, 0],
    endAngle: Math.PI, radius1: 20, radius2: 10,
  })
  console.log('[10] missing startAngle:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[10] messages:', JSON.stringify(r2.messages))

  // Wrong ID type (passing partId instead of shapeId)
  const r3 = await api.v1.curve.ellipticArc({
    id: partId, centerPos: [0, 0, 0],
    startAngle: 0, endAngle: Math.PI, radius1: 20, radius2: 10,
  })
  console.log('[10] wrong id type:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[10] messages:', JSON.stringify(r3.messages))

  // 2D point
  const r4 = await api.v1.curve.ellipticArc({
    id: shapeId, centerPos: [0, 0],
    startAngle: 0, endAngle: Math.PI, radius1: 20, radius2: 10,
  })
  console.log('[10] 2D point:', r4.result, 'maxLevel:', r4.maxLevel)
  console.log('[10] messages:', JSON.stringify(r4.messages))

  filewrite({
    missingRadius2: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    missingStartAngle: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    wrongIdType: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
    point2D: { result: r4.result, maxLevel: r4.maxLevel, messages: r4.messages },
  }, 'error-responses')

  return { partId }
}
