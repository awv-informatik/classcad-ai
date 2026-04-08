// Q: Does radius fillet work correctly with l/a and l/ar mode segments?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({})).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Test 1: Radius on vertex between l/a segments
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'RadiusLA' })).result
  const r1 = await api.v1.curve.advancedPolyline({
    id: s1,
    pld: [
      { xa: 0, ya: 0 },
      { l: 40, a: 0, r: 8 },               // east, fillet at this corner
      { l: 40, a: Math.PI / 2 },            // north
    ],
  })
  console.log('[13a] radius on l/a vertex → maxLevel:', r1.maxLevel)

  // Test 2: Radius on vertex between l/ar segments
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'RadiusLAr' })).result
  const r2 = await api.v1.curve.advancedPolyline({
    id: s2,
    pld: [
      { xa: 0, ya: 60 },
      { l: 40, a: 0, r: 8 },
      { l: 40, ar: Math.PI / 2, r: 8 },     // turn 90° with fillet
      { l: 40, ar: Math.PI / 2 },            // turn 90° again
    ],
    close: true,
  })
  console.log('[13b] radius on l/ar vertex → maxLevel:', r2.maxLevel)

  // Test 3: Chamfer on vertex between l/a segments
  const s3 = (await api.v1.curve.shape({ id: eifId, name: 'ChamferLA' })).result
  const r3 = await api.v1.curve.advancedPolyline({
    id: s3,
    pld: [
      { xa: 0, ya: 140 },
      { l: 40, a: 0, c: 5 },
      { l: 40, a: Math.PI / 2, c: 5 },
      { l: 40, a: Math.PI },
    ],
    close: true,
  })
  console.log('[13c] chamfer on l/a vertex → maxLevel:', r3.maxLevel)

  // Test 4: Radius on movement+angle combo vertex
  const s4 = (await api.v1.curve.shape({ id: eifId, name: 'RadiusMvAngle' })).result
  const r4 = await api.v1.curve.advancedPolyline({
    id: s4,
    pld: [
      { xa: 0, ya: 220 },
      { xa: 40, a: Math.PI / 6, r: 5 },     // movement+angle with fillet
      { xa: 80, ya: 250 },
    ],
  })
  console.log('[13d] radius on movement+angle → maxLevel:', r4.maxLevel)

  filewrite({
    radiusLA: { maxLevel: r1.maxLevel, messages: r1.messages },
    radiusLAr: { maxLevel: r2.maxLevel, messages: r2.messages },
    chamferLA: { maxLevel: r3.maxLevel, messages: r3.messages },
    radiusMvAngle: { maxLevel: r4.maxLevel, messages: r4.messages },
  }, 'radius-angle-results')

  await snapshot('radius-with-angle-modes')
  return { partId }
}
