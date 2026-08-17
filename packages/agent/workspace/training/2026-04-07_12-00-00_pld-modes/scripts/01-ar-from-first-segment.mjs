// Q: Does l/ar work from the very first segment after the start point?
// What is the implicit "previous direction" for the first ar segment?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({})).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Shape 1: l/ar from second PLD — what direction does ar reference?
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'ArFromFirst' })).result
  const r1 = await api.v1.curve.advancedPolyline({
    id: s1,
    pld: [
      { xa: 0, ya: 0 },
      { l: 40, ar: 0 },         // ar=0 means "same as previous direction" — but there IS no previous segment
      { l: 40, ar: Math.PI / 2 }, // turn 90° CCW from whatever direction was established
    ],
  })
  console.log('[01] ar from first segment: maxLevel', r1.maxLevel, 'messages:', JSON.stringify(r1.messages))

  // Shape 2: l/a (absolute) for comparison — known behavior
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'AbsAngleRef' })).result
  await api.v1.curve.advancedPolyline({
    id: s2,
    pld: [
      { xa: 0, ya: 60 },
      { l: 40, a: 0 },           // 0 degrees = positive X
      { l: 40, a: Math.PI / 2 }, // 90 degrees = positive Y
    ],
  })

  // Shape 3: ar with explicit first direction set by l/a then ar turns
  const s3 = (await api.v1.curve.shape({ id: eifId, name: 'ArChain' })).result
  await api.v1.curve.advancedPolyline({
    id: s3,
    pld: [
      { xa: 0, ya: 120 },
      { l: 30, a: 0 },              // first direction = east (0°)
      { l: 30, ar: Math.PI / 4 },   // turn 45° CCW = NE
      { l: 30, ar: Math.PI / 4 },   // another 45° CCW = N
      { l: 30, ar: Math.PI / 4 },   // another 45° CCW = NW
    ],
  })

  await snapshot('ar-from-first')
  return { partId }
}
