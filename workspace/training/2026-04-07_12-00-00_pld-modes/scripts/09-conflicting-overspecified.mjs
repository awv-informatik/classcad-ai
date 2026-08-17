// Q: What happens with overspecified PLDs? (e.g., xa + xr + ya on same entry, or l + xa + ya)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({})).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Test 1: xa + xr on same PLD (both absolute and relative X)
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'XaXr' })).result
  const r1 = await api.v1.curve.advancedPolyline({
    id: s1,
    pld: [
      { xa: 0, ya: 0 },
      { xa: 40, xr: 10, ya: 20 },   // both xa and xr — which wins?
    ],
  })
  console.log('[09a] xa+xr → maxLevel:', r1.maxLevel, 'messages:', JSON.stringify(r1.messages))

  // Test 2: ya + yr on same PLD
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'YaYr' })).result
  const r2 = await api.v1.curve.advancedPolyline({
    id: s2,
    pld: [
      { xa: 0, ya: 60 },
      { xa: 40, ya: 80, yr: 10 },   // both ya and yr
    ],
  })
  console.log('[09b] ya+yr → maxLevel:', r2.maxLevel, 'messages:', JSON.stringify(r2.messages))

  // Test 3: l + xa + ya (length+direction AND absolute coordinates)
  const s3 = (await api.v1.curve.shape({ id: eifId, name: 'LXaYa' })).result
  const r3 = await api.v1.curve.advancedPolyline({
    id: s3,
    pld: [
      { xa: 0, ya: 120 },
      { l: 50, a: 0, xa: 40, ya: 120 },  // both coordinate + angle+length
    ],
  })
  console.log('[09c] l+a+xa+ya → maxLevel:', r3.maxLevel, 'messages:', JSON.stringify(r3.messages))

  // Test 4: a + ar on same PLD (both absolute and relative angle)
  const s4 = (await api.v1.curve.shape({ id: eifId, name: 'AAr' })).result
  const r4 = await api.v1.curve.advancedPolyline({
    id: s4,
    pld: [
      { xa: 0, ya: 180 },
      { l: 20, a: 0 },                    // establish direction
      { l: 30, a: Math.PI / 4, ar: Math.PI / 2 },  // both a and ar
    ],
  })
  console.log('[09d] a+ar → maxLevel:', r4.maxLevel, 'messages:', JSON.stringify(r4.messages))

  filewrite({
    'xa+xr': { maxLevel: r1.maxLevel, messages: r1.messages },
    'ya+yr': { maxLevel: r2.maxLevel, messages: r2.messages },
    'l+xa+ya': { maxLevel: r3.maxLevel, messages: r3.messages },
    'a+ar': { maxLevel: r4.maxLevel, messages: r4.messages },
  }, 'overspecified-results')

  return { partId }
}
