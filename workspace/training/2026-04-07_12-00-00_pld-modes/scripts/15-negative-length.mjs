// Q: What happens with negative l values? Does it reverse direction?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({})).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Test 1: Negative l with absolute angle
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'NegLAbsA' })).result
  const r1 = await api.v1.curve.advancedPolyline({
    id: s1,
    pld: [
      { xa: 50, ya: 0 },
      { l: -30, a: 0 },          // negative length at 0° — should go west?
      { l: 30, a: Math.PI / 2 }, // then north
    ],
  })
  console.log('[15a] l:-30 a:0 → maxLevel:', r1.maxLevel, 'msgs:', JSON.stringify(r1.messages))

  // Test 2: Negative l with relative angle
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'NegLRelA' })).result
  const r2 = await api.v1.curve.advancedPolyline({
    id: s2,
    pld: [
      { xa: 50, ya: 60 },
      { l: 30, a: 0 },           // east
      { l: -20, ar: 0 },         // negative length, same direction → backward?
    ],
  })
  console.log('[15b] l:-20 ar:0 → maxLevel:', r2.maxLevel, 'msgs:', JSON.stringify(r2.messages))

  filewrite({
    negLAbsA: { maxLevel: r1.maxLevel, messages: r1.messages },
    negLRelA: { maxLevel: r2.maxLevel, messages: r2.messages },
  }, 'negative-length-results')

  await snapshot('negative-length')
  return { partId }
}
