// Full bracket plate with geometry + dimensional constraints matching the technical drawing
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BracketPlate' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // --- GEOMETRY ---
  // Profile vertices (clockwise from top-left)
  const verts = [
    [0, 75, 0], [60, 75, 0], [60, 0, 0], [0, 0, 0],
    [0, 25, 0], [20, 25, 0], [20, 55, 0], [0, 55, 0],
  ]
  const lineIds = []
  for (let i = 0; i < verts.length; i++) {
    const r = await api.v1.sketch.line({
      id: skId, startPos: verts[i], endPos: verts[(i + 1) % verts.length],
    })
    lineIds.push(r.result)
  }
  console.log('[03] lines:', lineIds)

  // R10 fillets at notch inner corners
  const f1 = await api.v1.sketch.fillet({ id: skId, lineIds: [lineIds[4], lineIds[5]], radius: 10 })
  const f2 = await api.v1.sketch.fillet({ id: skId, lineIds: [lineIds[5], lineIds[6]], radius: 10 })
  console.log('[03] fillet1:', f1.result, 'fillet2:', f2.result)

  // Two holes
  const h1 = await api.v1.sketch.circle({ id: skId, centerPos: [30, 55, 0], radius: 5 })
  const h2 = await api.v1.sketch.circle({ id: skId, centerPos: [30, 10, 0], radius: 5 })
  console.log('[03] holes:', h1.result, h2.result)

  // --- GET POINT IDs for positional dimensions ---
  // Upper hole center point
  const h1pts = await api.v1.sketch.getPoints({ id: h1.result })
  const h1center = h1pts.result[0]
  console.log('[03] upper hole center pt:', h1center)

  // Lower hole center point
  const h2pts = await api.v1.sketch.getPoints({ id: h2.result })
  const h2center = h2pts.result[0]
  console.log('[03] lower hole center pt:', h2center)

  // Top edge (L0) endpoints — need a point on the top edge
  const L0pts = await api.v1.sketch.getPoints({ id: lineIds[0] })
  const topLeftPt = L0pts.result[0]  // (0, 75)
  console.log('[03] top-left pt:', topLeftPt)

  // Left top section (L7) start point at (0, 55)
  const L7pts = await api.v1.sketch.getPoints({ id: lineIds[7] })
  const leftNotchTopPt = L7pts.result[0]  // (0, 55)
  console.log('[03] left notch top pt:', leftNotchTopPt)

  // Left bottom section (L3) start point at (0, 0)
  const L3pts = await api.v1.sketch.getPoints({ id: lineIds[3] })
  const bottomLeftPt = L3pts.result[0]  // (0, 0)
  console.log('[03] bottom-left pt:', bottomLeftPt)

  // Bottom edge (L2) start point at (60, 0) — or use L3 start at (0, 0)
  const L2pts = await api.v1.sketch.getPoints({ id: lineIds[2] })
  const bottomRightPt = L2pts.result[0]  // (60, 0)
  console.log('[03] bottom-right pt:', bottomRightPt)

  // Notch bottom (L4) endpoint at (0, 25) — start of L4
  const L4pts = await api.v1.sketch.getPoints({ id: lineIds[4] })
  const notchBottomPt = L4pts.result[0]  // (0, 25)
  console.log('[03] notch bottom pt:', notchBottomPt)

  // --- DIMENSIONS matching the drawing ---
  const dims = []

  // 1. Top width = 60 (OFFSET on top edge L0)
  const d1 = await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [lineIds[0]] })
  console.log('[03] dim top-width:', d1.result, 'maxLevel:', d1.maxLevel)
  dims.push({ name: 'top-width=60', id: d1.result, level: d1.maxLevel })

  // 2. Right edge height = 75 (OFFSET on right edge L1) — implied total height
  const d1b = await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [lineIds[1]] })
  console.log('[03] dim right-height:', d1b.result, 'maxLevel:', d1b.maxLevel)

  // 3. Bottom width = 60 (OFFSET on bottom edge L2)
  const d2 = await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [lineIds[2]] })
  console.log('[03] dim bottom-width:', d2.result, 'maxLevel:', d2.maxLevel)

  // 4. Left bottom section = 25 (OFFSET on L3)
  const d3 = await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [lineIds[3]] })
  console.log('[03] dim left-bottom=25:', d3.result, 'maxLevel:', d3.maxLevel)

  // 5. Left top section = 20 (OFFSET on L7)
  const d4 = await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [lineIds[7]] })
  console.log('[03] dim left-top=20:', d4.result, 'maxLevel:', d4.maxLevel)

  // 6. Notch bottom edge = 20 (OFFSET on L4 — notch depth)
  const d5 = await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [lineIds[4]] })
  console.log('[03] dim notch-depth=20:', d5.result, 'maxLevel:', d5.maxLevel)

  // 7. From left to upper hole = 30 (HORIZONTAL_DISTANCE)
  const d6 = await api.v1.sketch.dimension({
    id: skId, type: 'HORIZONTAL_DISTANCE',
    geomIds: [topLeftPt, h1center],
  })
  console.log('[03] dim hole1-X=30:', d6.result, 'maxLevel:', d6.maxLevel)

  // 8. From top to upper hole = 20 (VERTICAL_DISTANCE)
  const d7 = await api.v1.sketch.dimension({
    id: skId, type: 'VERTICAL_DISTANCE',
    geomIds: [topLeftPt, h1center],
  })
  console.log('[03] dim hole1-Y=20:', d7.result, 'maxLevel:', d7.maxLevel)

  // 9. From bottom to lower hole = 10 (VERTICAL_DISTANCE)
  const d8 = await api.v1.sketch.dimension({
    id: skId, type: 'VERTICAL_DISTANCE',
    geomIds: [bottomLeftPt, h2center],
  })
  console.log('[03] dim hole2-Y=10:', d8.result, 'maxLevel:', d8.maxLevel)

  // 10. R10 fillet radii
  const d9 = await api.v1.sketch.dimension({ id: skId, type: 'RADIUS', geomIds: [f1.result[0]] })
  console.log('[03] dim fillet1-R10:', d9.result, 'maxLevel:', d9.maxLevel)

  const d10 = await api.v1.sketch.dimension({ id: skId, type: 'RADIUS', geomIds: [f2.result[0]] })
  console.log('[03] dim fillet2-R10:', d10.result, 'maxLevel:', d10.maxLevel)

  // 11. Hole radii = R5
  const d11 = await api.v1.sketch.dimension({ id: skId, type: 'RADIUS', geomIds: [h1.result] })
  console.log('[03] dim hole1-R5:', d11.result, 'maxLevel:', d11.maxLevel)

  const d12 = await api.v1.sketch.dimension({ id: skId, type: 'RADIUS', geomIds: [h2.result] })
  console.log('[03] dim hole2-R5:', d12.result, 'maxLevel:', d12.maxLevel)

  await snapshot('bracket-dims')

  return { partId, skId }
}
