// Test minimum PLD: 2 points, 1 point, empty
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({})).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Test 1: 2 points (minimum valid?)
  const s1 = (await api.v1.curve.shape({ id: eifId, name: '2pts' })).result
  const r1 = await api.v1.curve.advancedPolyline({
    id: s1,
    pld: [
      { xa: 0, ya: 0 },
      { xa: 50, ya: 30 },
    ],
  })
  console.log('[14a] 2 points - result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[14a] messages:', JSON.stringify(r1.messages))

  // Test 2: 1 point only
  const s2 = (await api.v1.curve.shape({ id: eifId, name: '1pt' })).result
  const r2 = await api.v1.curve.advancedPolyline({
    id: s2,
    pld: [
      { xa: 0, ya: 100 },
    ],
  })
  console.log('[14b] 1 point - result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[14b] messages:', JSON.stringify(r2.messages))

  // Test 3: empty pld
  const s3 = (await api.v1.curve.shape({ id: eifId, name: 'empty' })).result
  const r3 = await api.v1.curve.advancedPolyline({
    id: s3,
    pld: [],
  })
  console.log('[14c] empty pld - result:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[14c] messages:', JSON.stringify(r3.messages))

  filewrite({
    twoPoints: { result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel },
    onePoint: { result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel },
    emptyPld: { result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel },
  }, 'min-pld-response')

  await snapshot('min-pld')
  return { partId }
}
