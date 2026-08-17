// Q: How does close:true interact with l/ar and l/a modes?
// Does the closing segment respect the direction chain?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({})).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Test 1: Close with last segment being l/ar
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'CloseAfterAr' })).result
  const r1 = await api.v1.curve.advancedPolyline({
    id: s1,
    pld: [
      { xa: 0, ya: 0 },
      { l: 40, a: 0 },                // east
      { l: 40, ar: Math.PI / 2 },     // turn 90° → north
      // Close should connect back to (0,0)
    ],
    close: true,
  })
  console.log('[08a] close after ar → maxLevel:', r1.maxLevel)

  // Test 2: Close with radius on last point + l/ar mode
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'CloseArRadius' })).result
  const r2 = await api.v1.curve.advancedPolyline({
    id: s2,
    pld: [
      { xa: 0, ya: 80 },
      { l: 40, a: 0, r: 5 },                // east with fillet
      { l: 40, ar: Math.PI / 2, r: 5 },     // north with fillet
      { l: 40, ar: Math.PI / 2, r: 5 },     // west with fillet
    ],
    close: true,
  })
  console.log('[08b] close with ar+radius → maxLevel:', r2.maxLevel)

  // Test 3: Close with radius on first point when using ar
  const s3 = (await api.v1.curve.shape({ id: eifId, name: 'CloseFirstR' })).result
  const r3 = await api.v1.curve.advancedPolyline({
    id: s3,
    pld: [
      { xa: 0, ya: 160, r: 8 },     // first point gets fillet at close junction
      { l: 50, a: 0 },               // east
      { l: 50, ar: Math.PI / 2 },    // north
      { l: 50, ar: Math.PI / 2 },    // west
      { l: 50, ar: Math.PI / 2 },    // south
    ],
    close: true,
  })
  console.log('[08c] close with first-point radius + ar → maxLevel:', r3.maxLevel)

  filewrite({
    closeAfterAr: { maxLevel: r1.maxLevel, messages: r1.messages },
    closeArRadius: { maxLevel: r2.maxLevel, messages: r2.messages },
    closeFirstR: { maxLevel: r3.maxLevel, messages: r3.messages },
  }, 'close-with-angle-results')

  await snapshot('close-with-angle-modes')
  return { partId }
}
