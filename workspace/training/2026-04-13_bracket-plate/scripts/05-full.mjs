// Full bracket plate: geometry + all dimensional constraints
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BracketPlate' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // --- GEOMETRY ---
  const verts = [
    [0, 75, 0], [60, 75, 0], [60, 0, 0], [0, 0, 0],
    [0, 25, 0], [20, 25, 0], [20, 55, 0], [0, 55, 0],
  ]
  const L = []
  for (let i = 0; i < verts.length; i++) {
    const r = await api.v1.sketch.line({
      id: skId, startPos: verts[i], endPos: verts[(i + 1) % verts.length],
    })
    L.push(r.result)
  }
  // L0=top, L1=right, L2=bottom, L3=leftBot, L4=notchBot, L5=notchWall, L6=notchTop, L7=leftTop

  // R10 fillets
  const f1 = await api.v1.sketch.fillet({ id: skId, lineIds: [L[4], L[5]], radius: 10 })
  const f2 = await api.v1.sketch.fillet({ id: skId, lineIds: [L[5], L[6]], radius: 10 })

  // Holes
  const h1 = await api.v1.sketch.circle({ id: skId, centerPos: [30, 55, 0], radius: 5 })
  const h2 = await api.v1.sketch.circle({ id: skId, centerPos: [30, 10, 0], radius: 5 })

  // --- POINT IDs ---
  const h1center = (await api.v1.sketch.getPoints({ id: h1.result })).result.centerId
  const h2center = (await api.v1.sketch.getPoints({ id: h2.result })).result.centerId
  const topLeftPt = (await api.v1.sketch.getPoints({ id: L[0] })).result.startId   // (0,75)
  const botLeftPt = (await api.v1.sketch.getPoints({ id: L[3] })).result.startId   // (0,0)

  console.log('[05] pts:', { h1center, h2center, topLeftPt, botLeftPt })

  // --- DIMENSIONS ---
  // 1. Top width = 60
  const d1 = await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [L[0]] })
  console.log('[05] top-width:', d1.result, d1.maxLevel)

  // 2. Bottom width = 60
  const d2 = await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [L[2]] })
  console.log('[05] bot-width:', d2.result, d2.maxLevel)

  // 3. Left top section = 20 (from top to notch ceiling)
  const d3 = await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [L[7]] })
  console.log('[05] left-top=20:', d3.result, d3.maxLevel)

  // 4. Left bottom section = 25 (from bottom to notch floor)
  const d4 = await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [L[3]] })
  console.log('[05] left-bot=25:', d4.result, d4.maxLevel)

  // 5. From left to upper hole center = 30 (HORIZONTAL_DISTANCE)
  const d5 = await api.v1.sketch.dimension({
    id: skId, type: 'HORIZONTAL_DISTANCE', geomIds: [topLeftPt, h1center],
  })
  console.log('[05] hole1-X=30:', d5.result, d5.maxLevel)

  // 6. From top to upper hole center = 20 (VERTICAL_DISTANCE)
  const d6 = await api.v1.sketch.dimension({
    id: skId, type: 'VERTICAL_DISTANCE', geomIds: [topLeftPt, h1center],
  })
  console.log('[05] hole1-Y=20:', d6.result, d6.maxLevel)

  // 7. From bottom to lower hole center = 10 (VERTICAL_DISTANCE)
  const d7 = await api.v1.sketch.dimension({
    id: skId, type: 'VERTICAL_DISTANCE', geomIds: [botLeftPt, h2center],
  })
  console.log('[05] hole2-Y=10:', d7.result, d7.maxLevel)

  // 8. R10 fillet radii
  const d8 = await api.v1.sketch.dimension({ id: skId, type: 'RADIUS', geomIds: [f1.result[0]] })
  const d9 = await api.v1.sketch.dimension({ id: skId, type: 'RADIUS', geomIds: [f2.result[0]] })
  console.log('[05] fillet-R:', d8.result, d9.result)

  // 9. Hole radii
  const d10 = await api.v1.sketch.dimension({ id: skId, type: 'RADIUS', geomIds: [h1.result] })
  const d11 = await api.v1.sketch.dimension({ id: skId, type: 'RADIUS', geomIds: [h2.result] })
  console.log('[05] hole-R:', d10.result, d11.result)

  // 10. Notch depth = 20 (OFFSET on notch bottom edge L4)
  // Note: L4 may be trimmed by fillet, so its length is < 20
  // Instead use notch top edge L6 which should also be trimmed symmetrically
  // Actually let's just try L4
  const d12 = await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [L[4]] })
  console.log('[05] notch-bottom-len:', d12.result, d12.maxLevel)

  await snapshot('bracket-full')

  return { partId, skId }
}
