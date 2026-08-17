// Test edge cases: negative chamfer, zero chamfer, oversized chamfer
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({})).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Test 1: zero chamfer
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'ZeroC' })).result
  const r1 = await api.v1.curve.advancedPolyline({
    id: s1,
    pld: [
      { xa: 0, ya: 0, c: 0 },
      { xa: 40, ya: 0 },
      { xa: 40, ya: 30 },
      { xa: 0, ya: 30 },
    ],
    close: true,
  })
  console.log('[12a] zero chamfer - result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[12a] messages:', JSON.stringify(r1.messages))

  // Test 2: negative chamfer
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'NegC' })).result
  const r2 = await api.v1.curve.advancedPolyline({
    id: s2,
    pld: [
      { xa: 0, ya: 100 },
      { xa: 40, ya: 100, c: -5 },
      { xa: 40, ya: 130 },
      { xa: 0, ya: 130 },
    ],
    close: true,
  })
  console.log('[12b] negative chamfer - result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[12b] messages:', JSON.stringify(r2.messages))

  // Test 3: oversized chamfer
  const s3 = (await api.v1.curve.shape({ id: eifId, name: 'BigC' })).result
  const r3 = await api.v1.curve.advancedPolyline({
    id: s3,
    pld: [
      { xa: 0, ya: 200 },
      { xa: 20, ya: 200, c: 50 },   // chamfer 50 >> edge length 20
      { xa: 20, ya: 220 },
      { xa: 0, ya: 220 },
    ],
    close: true,
  })
  console.log('[12c] oversized chamfer - result:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[12c] messages:', JSON.stringify(r3.messages))

  filewrite({
    zeroChamfer: { result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel },
    negativeChamfer: { result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel },
    oversizedChamfer: { result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel },
  }, 'edge-chamfer-response')

  await snapshot('edge-chamfer')
  return { partId }
}
