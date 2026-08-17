// Q: What happens when ar is used as the very first segment after the start point?
// There is no "previous direction" to be relative to
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({})).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Test 1: ar=0 as first segment (should default to some direction?)
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'Ar0First' })).result
  const r1 = await api.v1.curve.advancedPolyline({
    id: s1,
    pld: [
      { xa: 0, ya: 0 },
      { l: 40, ar: 0 },          // "same as previous" — no previous exists
      { l: 20, ar: Math.PI / 2 },  // turn 90° from whatever direction was established
    ],
  })
  console.log('[06a] ar:0 first → maxLevel:', r1.maxLevel, 'messages:', JSON.stringify(r1.messages))

  // Test 2: ar=PI/2 as first segment
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'ArPi2First' })).result
  const r2 = await api.v1.curve.advancedPolyline({
    id: s2,
    pld: [
      { xa: 0, ya: 60 },
      { l: 40, ar: Math.PI / 2 },  // 90° from default direction
      { l: 20, ar: 0 },            // continue same direction
    ],
  })
  console.log('[06b] ar:PI/2 first → maxLevel:', r2.maxLevel)

  // Test 3: ar=PI as first segment
  const s3 = (await api.v1.curve.shape({ id: eifId, name: 'ArPiFirst' })).result
  const r3 = await api.v1.curve.advancedPolyline({
    id: s3,
    pld: [
      { xa: 0, ya: 120 },
      { l: 40, ar: Math.PI },       // 180° from default → should go opposite of default
      { l: 20, ar: 0 },             // continue same direction
    ],
  })
  console.log('[06c] ar:PI first → maxLevel:', r3.maxLevel)

  // Test 4: Compare ar=0 with a=0 — if default direction is east, they should be identical
  const s4 = (await api.v1.curve.shape({ id: eifId, name: 'A0Compare' })).result
  const r4 = await api.v1.curve.advancedPolyline({
    id: s4,
    pld: [
      { xa: 0, ya: 180 },
      { l: 40, a: 0 },           // explicit east
      { l: 20, a: Math.PI / 2 }, // explicit north
    ],
  })
  console.log('[06d] a:0 reference → maxLevel:', r4.maxLevel)

  filewrite({
    'ar0_first': { maxLevel: r1.maxLevel, messages: r1.messages },
    'arPi2_first': { maxLevel: r2.maxLevel, messages: r2.messages },
    'arPi_first': { maxLevel: r3.maxLevel, messages: r3.messages },
    'a0_reference': { maxLevel: r4.maxLevel, messages: r4.messages },
  }, 'ar-without-prior')

  await snapshot('ar-without-prior')
  return { partId }
}
