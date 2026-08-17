// Q: What happens with impossible movement+angle combos?
// e.g., ya=100 but angle points away from y=100
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({})).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Test 1: ya+a where angle is horizontal (can never reach the specified y)
  // Start at (0,0), request ya=50 at angle 0 (horizontal) — geometrically impossible
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'ImpossibleYA' })).result
  const r1 = await api.v1.curve.advancedPolyline({
    id: s1,
    pld: [
      { xa: 0, ya: 0 },
      { ya: 50, a: 0 },    // angle=0 is horizontal, can never reach y=50
    ],
  })
  console.log('[10a] ya:50 a:0 (impossible) → maxLevel:', r1.maxLevel, 'msgs:', JSON.stringify(r1.messages))

  // Test 2: xa+a where angle is vertical (can never reach the specified x)
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'ImpossibleXA' })).result
  const r2 = await api.v1.curve.advancedPolyline({
    id: s2,
    pld: [
      { xa: 0, ya: 60 },
      { xa: 50, a: Math.PI / 2 },   // angle=90° is vertical, can never reach x=50
    ],
  })
  console.log('[10b] xa:50 a:PI/2 (impossible) → maxLevel:', r2.maxLevel, 'msgs:', JSON.stringify(r2.messages))

  // Test 3: yr+a where angle goes opposite direction
  const s3 = (await api.v1.curve.shape({ id: eifId, name: 'OppositeYrA' })).result
  const r3 = await api.v1.curve.advancedPolyline({
    id: s3,
    pld: [
      { xa: 0, ya: 120 },
      { yr: 30, a: -Math.PI / 4 },   // angle points down-right but yr=30 (up)
    ],
  })
  console.log('[10c] yr:30 a:-PI/4 (conflicting) → maxLevel:', r3.maxLevel, 'msgs:', JSON.stringify(r3.messages))

  // Test 4: Negative yr with upward angle
  const s4 = (await api.v1.curve.shape({ id: eifId, name: 'NegYrUpAngle' })).result
  const r4 = await api.v1.curve.advancedPolyline({
    id: s4,
    pld: [
      { xa: 0, ya: 180 },
      { yr: -20, a: Math.PI / 2 },   // angle=90° (straight up) but yr=-20 (down)
    ],
  })
  console.log('[10d] yr:-20 a:PI/2 (impossible) → maxLevel:', r4.maxLevel, 'msgs:', JSON.stringify(r4.messages))

  filewrite({
    impossibleYA: { maxLevel: r1.maxLevel, messages: r1.messages },
    impossibleXA: { maxLevel: r2.maxLevel, messages: r2.messages },
    oppositeYrA: { maxLevel: r3.maxLevel, messages: r3.messages },
    negYrUpAngle: { maxLevel: r4.maxLevel, messages: r4.messages },
  }, 'impossible-combo-results')

  return { partId }
}
