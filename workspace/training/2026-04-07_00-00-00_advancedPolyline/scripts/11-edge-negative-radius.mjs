// Test edge cases: negative radius, zero radius, very large radius
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({})).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Test 1: zero radius
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'ZeroR' })).result
  const r1 = await api.v1.curve.advancedPolyline({
    id: s1,
    pld: [
      { xa: 0, ya: 0, r: 0 },
      { xa: 40, ya: 0, r: 0 },
      { xa: 40, ya: 30 },
      { xa: 0, ya: 30 },
    ],
    close: true,
  })
  console.log('[11a] zero radius - result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[11a] messages:', JSON.stringify(r1.messages))

  // Test 2: negative radius
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'NegR' })).result
  const r2 = await api.v1.curve.advancedPolyline({
    id: s2,
    pld: [
      { xa: 0, ya: 100 },
      { xa: 40, ya: 100, r: -5 },
      { xa: 40, ya: 130 },
      { xa: 0, ya: 130 },
    ],
    close: true,
  })
  console.log('[11b] negative radius - result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[11b] messages:', JSON.stringify(r2.messages))

  // Test 3: radius too large for edge length
  const s3 = (await api.v1.curve.shape({ id: eifId, name: 'BigR' })).result
  const r3 = await api.v1.curve.advancedPolyline({
    id: s3,
    pld: [
      { xa: 0, ya: 200 },
      { xa: 20, ya: 200, r: 50 },   // radius 50 >> edge length 20
      { xa: 20, ya: 220 },
      { xa: 0, ya: 220 },
    ],
    close: true,
  })
  console.log('[11c] oversized radius - result:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[11c] messages:', JSON.stringify(r3.messages))

  filewrite({
    zeroRadius: { result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel },
    negativeRadius: { result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel },
    oversizedRadius: { result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel },
  }, 'edge-radius-response')

  await snapshot('edge-radius')
  return { partId }
}
