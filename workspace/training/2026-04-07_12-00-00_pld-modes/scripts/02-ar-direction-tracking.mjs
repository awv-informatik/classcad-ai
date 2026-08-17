// Q: How does ar accumulate direction through multiple relative turns?
// Test: create a spiral-like pattern using only l/ar, then verify with absolute-angle equivalent
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({})).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Shape 1: Square using ar turns (90° each)
  // Start east, turn left 90° each time → should make a square
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'ArSquare' })).result
  const r1 = await api.v1.curve.advancedPolyline({
    id: s1,
    pld: [
      { xa: 0, ya: 0 },
      { l: 40, a: 0 },                // east (establish initial direction)
      { l: 40, ar: Math.PI / 2 },     // turn 90° CCW → north
      { l: 40, ar: Math.PI / 2 },     // turn 90° CCW → west
      { l: 40, ar: Math.PI / 2 },     // turn 90° CCW → south
    ],
    close: true,
  })
  console.log('[02] ar square: maxLevel', r1.maxLevel)
  filewrite({ result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages }, 'ar-square-response')

  // Shape 2: Equivalent using absolute angles
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'AbsSquare' })).result
  const r2 = await api.v1.curve.advancedPolyline({
    id: s2,
    pld: [
      { xa: 0, ya: 60 },
      { l: 40, a: 0 },                // east
      { l: 40, a: Math.PI / 2 },      // north
      { l: 40, a: Math.PI },           // west
      { l: 40, a: 3 * Math.PI / 2 },  // south
    ],
    close: true,
  })
  console.log('[02] abs square: maxLevel', r2.maxLevel)

  // Shape 3: 8 segments with ar=PI/4 each → should make an octagon
  const s3 = (await api.v1.curve.shape({ id: eifId, name: 'ArOctagon' })).result
  const pldEntries = [{ xa: 0, ya: 140 }, { l: 25, a: 0 }]
  for (let i = 0; i < 7; i++) {
    pldEntries.push({ l: 25, ar: Math.PI / 4 })
  }
  const r3 = await api.v1.curve.advancedPolyline({
    id: s3,
    pld: pldEntries,
    close: true,
  })
  console.log('[02] ar octagon: maxLevel', r3.maxLevel)

  await snapshot('ar-direction-tracking')
  return { partId }
}
