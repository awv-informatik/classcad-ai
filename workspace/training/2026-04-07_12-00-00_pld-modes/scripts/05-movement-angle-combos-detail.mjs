// Q: How do movement+angle combos behave with different angle/coordinate pairs?
// Test all documented combos: xa+a, xr+a, yr+a, ya+ar, yr+ar, xa+ar
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({})).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Test 1: xa + a (reach absolute x at given absolute angle)
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'XaA' })).result
  const r1 = await api.v1.curve.advancedPolyline({
    id: s1,
    pld: [
      { xa: 0, ya: 0 },
      { xa: 40, a: Math.PI / 6 },  // reach x=40 at 30° angle → should compute y
    ],
  })
  console.log('[05a] xa+a → maxLevel:', r1.maxLevel, 'result:', r1.result)

  // Test 2: xr + a (relative x at absolute angle)
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'XrA' })).result
  const r2 = await api.v1.curve.advancedPolyline({
    id: s2,
    pld: [
      { xa: 0, ya: 40 },
      { xr: 40, a: Math.PI / 6 },  // move 40 in x at 30° → y computed
    ],
  })
  console.log('[05b] xr+a → maxLevel:', r2.maxLevel)

  // Test 3: yr + a (relative y at absolute angle)
  const s3 = (await api.v1.curve.shape({ id: eifId, name: 'YrA' })).result
  const r3 = await api.v1.curve.advancedPolyline({
    id: s3,
    pld: [
      { xa: 0, ya: 80 },
      { yr: 30, a: Math.PI / 3 },   // move 30 in y at 60° → x computed
    ],
  })
  console.log('[05c] yr+a → maxLevel:', r3.maxLevel)

  // Test 4: ya + ar (reach absolute y at relative angle)
  // First, establish a direction with a/l, then use ya+ar
  const s4 = (await api.v1.curve.shape({ id: eifId, name: 'YaAr' })).result
  const r4 = await api.v1.curve.advancedPolyline({
    id: s4,
    pld: [
      { xa: 0, ya: 120 },
      { l: 20, a: 0 },               // go east (establish direction)
      { ya: 140, ar: Math.PI / 4 },  // reach y=140, turning 45° CCW from east
    ],
  })
  console.log('[05d] ya+ar → maxLevel:', r4.maxLevel)

  // Test 5: yr + ar (relative y at relative angle)
  const s5 = (await api.v1.curve.shape({ id: eifId, name: 'YrAr' })).result
  const r5 = await api.v1.curve.advancedPolyline({
    id: s5,
    pld: [
      { xa: 0, ya: 160 },
      { l: 20, a: 0 },                // go east
      { yr: 20, ar: Math.PI / 4 },    // move 20 in y, turning 45° from east
    ],
  })
  console.log('[05e] yr+ar → maxLevel:', r5.maxLevel)

  // Test 6: xa + ar (reach absolute x at relative angle)
  const s6 = (await api.v1.curve.shape({ id: eifId, name: 'XaAr' })).result
  const r6 = await api.v1.curve.advancedPolyline({
    id: s6,
    pld: [
      { xa: 0, ya: 200 },
      { l: 20, a: 0 },                // go east
      { xa: 40, ar: Math.PI / 4 },    // reach x=40, turning 45° from east
    ],
  })
  console.log('[05f] xa+ar → maxLevel:', r6.maxLevel)

  filewrite({
    'xa+a': { maxLevel: r1.maxLevel, messages: r1.messages },
    'xr+a': { maxLevel: r2.maxLevel, messages: r2.messages },
    'yr+a': { maxLevel: r3.maxLevel, messages: r3.messages },
    'ya+ar': { maxLevel: r4.maxLevel, messages: r4.messages },
    'yr+ar': { maxLevel: r5.maxLevel, messages: r5.messages },
    'xa+ar': { maxLevel: r6.maxLevel, messages: r6.messages },
  }, 'movement-angle-results')

  await snapshot('movement-angle-combos')
  return { partId }
}
