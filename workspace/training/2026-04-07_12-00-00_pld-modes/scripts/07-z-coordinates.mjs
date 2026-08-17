// Q: Does advancedPolyline support z-coordinates or is it strictly 2D?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({})).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Test 1: Use 3-element arrays in xa/ya format... wait, xa/ya are scalars not arrays.
  // The PLD only has xa, ya, xr, yr — no za/zr fields.
  // But let's try adding a z field to see if it's silently ignored or causes an error.

  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'WithZ' })).result
  const r1 = await api.v1.curve.advancedPolyline({
    id: s1,
    pld: [
      { xa: 0, ya: 0, z: 10 },      // undocumented z field
      { xa: 40, ya: 0, z: 20 },
      { xa: 40, ya: 40, z: 30 },
    ],
  })
  console.log('[07a] with z field → maxLevel:', r1.maxLevel, 'messages:', JSON.stringify(r1.messages))

  // Test 2: Try za field (mimicking xa/ya pattern)
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'WithZa' })).result
  const r2 = await api.v1.curve.advancedPolyline({
    id: s2,
    pld: [
      { xa: 0, ya: 0, za: 10 },     // za field (doesn't exist in docs)
      { xa: 40, ya: 0, za: 20 },
      { xa: 40, ya: 40, za: 30 },
    ],
  })
  console.log('[07b] with za field → maxLevel:', r2.maxLevel, 'messages:', JSON.stringify(r2.messages))

  filewrite({
    'withZ': { maxLevel: r1.maxLevel, messages: r1.messages, result: r1.result },
    'withZa': { maxLevel: r2.maxLevel, messages: r2.messages, result: r2.result },
  }, 'z-coordinate-results')

  return { partId }
}
