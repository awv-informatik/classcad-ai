// Practical test: Regular polygons using l/ar mode (pentagon, hexagon)
// This tests ar accumulation in a real-world scenario
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({})).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Pentagon: 5 sides, exterior angle = 2π/5 = 72° per turn
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'Pentagon' })).result
  const pentAngle = (2 * Math.PI) / 5
  const r1 = await api.v1.curve.advancedPolyline({
    id: s1,
    pld: [
      { xa: 0, ya: 0 },
      { l: 30, a: 0 },
      { l: 30, ar: pentAngle },
      { l: 30, ar: pentAngle },
      { l: 30, ar: pentAngle },
    ],
    close: true,
  })
  console.log('[14a] pentagon: maxLevel', r1.maxLevel)

  // Hexagon: 6 sides, exterior angle = 2π/6 = 60°
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'Hexagon' })).result
  const hexAngle = (2 * Math.PI) / 6
  const r2 = await api.v1.curve.advancedPolyline({
    id: s2,
    pld: [
      { xa: 0, ya: 80 },
      { l: 25, a: 0 },
      { l: 25, ar: hexAngle },
      { l: 25, ar: hexAngle },
      { l: 25, ar: hexAngle },
      { l: 25, ar: hexAngle },
    ],
    close: true,
  })
  console.log('[14b] hexagon: maxLevel', r2.maxLevel)

  // Star shape: alternate sharp and wide turns
  const s3 = (await api.v1.curve.shape({ id: eifId, name: 'Star5' })).result
  const starPld = [{ xa: 0, ya: 180 }, { l: 40, a: Math.PI / 2 }]
  for (let i = 0; i < 4; i++) {
    starPld.push({ l: 40, ar: -(4 * Math.PI / 5) })  // sharp inward turn
    starPld.push({ l: 40, ar: (4 * Math.PI / 5) })    // wide outward turn
  }
  starPld.push({ l: 40, ar: -(4 * Math.PI / 5) })
  const r3 = await api.v1.curve.advancedPolyline({
    id: s3,
    pld: starPld,
    close: true,
  })
  console.log('[14c] 5-point star: maxLevel', r3.maxLevel)

  filewrite({
    pentagon: { maxLevel: r1.maxLevel, messages: r1.messages },
    hexagon: { maxLevel: r2.maxLevel, messages: r2.messages },
    star: { maxLevel: r3.maxLevel, messages: r3.messages },
  }, 'polygon-results')

  await snapshot('regular-polygons')
  return { partId }
}
