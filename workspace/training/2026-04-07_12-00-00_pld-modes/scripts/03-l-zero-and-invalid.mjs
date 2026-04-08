// Q: What happens with l: 0? a without l? Underspecified PLDs?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({})).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Test 1: l: 0 (zero-length segment)
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'ZeroLength' })).result
  const r1 = await api.v1.curve.advancedPolyline({
    id: s1,
    pld: [
      { xa: 0, ya: 0 },
      { l: 0, a: 0 },         // zero-length segment
      { l: 40, a: Math.PI / 2 },
    ],
  })
  console.log('[03a] l:0 → maxLevel:', r1.maxLevel, 'messages:', JSON.stringify(r1.messages))

  // Test 2: a without l (angle only, no length specified)
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'AngleOnly' })).result
  const r2 = await api.v1.curve.advancedPolyline({
    id: s2,
    pld: [
      { xa: 0, ya: 60 },
      { a: Math.PI / 4 },      // angle but no length — underspecified
      { xa: 40, ya: 60 },
    ],
  })
  console.log('[03b] a without l → maxLevel:', r2.maxLevel, 'messages:', JSON.stringify(r2.messages))

  // Test 3: l without a or ar (length only, no direction)
  const s3 = (await api.v1.curve.shape({ id: eifId, name: 'LengthOnly' })).result
  const r3 = await api.v1.curve.advancedPolyline({
    id: s3,
    pld: [
      { xa: 0, ya: 120 },
      { l: 40 },               // length but no angle
      { xa: 40, ya: 140 },
    ],
  })
  console.log('[03c] l without angle → maxLevel:', r3.maxLevel, 'messages:', JSON.stringify(r3.messages))

  // Test 4: empty PLD object {}
  const s4 = (await api.v1.curve.shape({ id: eifId, name: 'EmptyPLD' })).result
  const r4 = await api.v1.curve.advancedPolyline({
    id: s4,
    pld: [
      { xa: 0, ya: 180 },
      {},                       // completely empty PLD entry
      { xa: 40, ya: 180 },
    ],
  })
  console.log('[03d] empty PLD {} → maxLevel:', r4.maxLevel, 'messages:', JSON.stringify(r4.messages))

  // Test 5: xr: 0, yr: 0 (zero relative movement)
  const s5 = (await api.v1.curve.shape({ id: eifId, name: 'ZeroRelative' })).result
  const r5 = await api.v1.curve.advancedPolyline({
    id: s5,
    pld: [
      { xa: 0, ya: 240 },
      { xr: 0, yr: 0 },        // zero relative movement
      { xa: 40, ya: 240 },
    ],
  })
  console.log('[03e] xr:0,yr:0 → maxLevel:', r5.maxLevel, 'messages:', JSON.stringify(r5.messages))

  filewrite({
    zeroLength: { maxLevel: r1.maxLevel, messages: r1.messages },
    angleOnly: { maxLevel: r2.maxLevel, messages: r2.messages },
    lengthOnly: { maxLevel: r3.maxLevel, messages: r3.messages },
    emptyPLD: { maxLevel: r4.maxLevel, messages: r4.messages },
    zeroRelative: { maxLevel: r5.maxLevel, messages: r5.messages },
  }, 'invalid-pld-results')

  return { partId }
}
