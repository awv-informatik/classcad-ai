// Z-shape bracket plate — exact replication from technical drawing
//
// Dimensions from drawing:
//   60 = overall width (top and bottom)
//   30 = from left edge to upper hole center (horizontal)
//   20 = from top to upper hole center / left step level (vertical)
//   30 = from upper hole to right step level (vertical)
//   25 = from bottom to right step level (vertical)
//   10 = from bottom to lower hole center (vertical)
//   R10 = fillet radius at both inner corners
//   Total height = 20 + 30 + 25 = 75
//
// Profile (Z-shape, clockwise from top-left):
//   (0,75) → (60,75) → (60,25) → (40,25) → (40,0) → (20,0) → (20,55) → (0,55) → (0,75)
//
// Step depths: 20 each (estimated — not dimensioned)
// Holes: R5 (estimated — not dimensioned)

export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BracketPlate' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // --- Z-SHAPE PROFILE ---
  const verts = [
    [0, 75, 0],   // 0: top-left
    [60, 75, 0],  // 1: top-right
    [60, 25, 0],  // 2: right step top
    [40, 25, 0],  // 3: right step inner corner
    [40, 0, 0],   // 4: bottom-right
    [20, 0, 0],   // 5: bottom-left
    [20, 55, 0],  // 6: left step inner corner
    [0, 55, 0],   // 7: left step top
  ]
  const L = []
  for (let i = 0; i < verts.length; i++) {
    const r = await api.v1.sketch.line({
      id: skId, startPos: verts[i], endPos: verts[(i + 1) % verts.length],
    })
    L.push(r.result)
  }
  // L0=top, L1=rightUpper, L2=rightStep, L3=rightLower, L4=bottom, L5=leftLower, L6=leftStep, L7=leftUpper

  // --- R10 FILLETS at inner corners ---
  // Left inner corner (20,55): L5 (up) meets L6 (left)
  const f1 = await api.v1.sketch.fillet({ id: skId, lineIds: [L[5], L[6]], radius: 10 })
  console.log('[11] fillet1 @(20,55):', f1.result ? '✓' : '✗', 'maxLevel:', f1.maxLevel)

  // Right inner corner (40,25): L2 (left) meets L3 (down)
  const f2 = await api.v1.sketch.fillet({ id: skId, lineIds: [L[2], L[3]], radius: 10 })
  console.log('[11] fillet2 @(40,25):', f2.result ? '✓' : '✗', 'maxLevel:', f2.maxLevel)

  // --- HOLES ---
  const h1 = await api.v1.sketch.circle({ id: skId, centerPos: [30, 55, 0], radius: 5 })
  const h2 = await api.v1.sketch.circle({ id: skId, centerPos: [30, 10, 0], radius: 5 })

  // --- DIMENSIONAL CONSTRAINTS ---
  // Get point IDs for positional dimensions
  const h1center = (await api.v1.sketch.getPoints({ id: h1.result })).result.centerId
  const h2center = (await api.v1.sketch.getPoints({ id: h2.result })).result.centerId
  const topLeftPt = (await api.v1.sketch.getPoints({ id: L[0] })).result.startId   // (0,75)
  const botLeftPt = (await api.v1.sketch.getPoints({ id: L[5] })).result.startId    // (20,0)
  // Need a point at (0,75) for left edge reference — topLeftPt is at (0,75) ✓

  // 1. Overall width = 60 (OFFSET on top edge)
  await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [L[0]] })
  // 2. From left to upper hole = 30 (HORIZONTAL_DISTANCE)
  await api.v1.sketch.dimension({ id: skId, type: 'HORIZONTAL_DISTANCE', geomIds: [topLeftPt, h1center] })
  // 3. From top to upper hole = 20 (VERTICAL_DISTANCE)
  await api.v1.sketch.dimension({ id: skId, type: 'VERTICAL_DISTANCE', geomIds: [topLeftPt, h1center] })
  // 4. Left step section = 20 (OFFSET on L7: left upper edge, from (0,55) to (0,75) = 20)
  await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [L[7]] })
  // 5. Right step from bottom = 25 (OFFSET on L1: right upper edge, from (60,75) to (60,25) = 50)
  // Actually L3 (right lower) goes from (40,25) to (40,0) = 25 — but it's trimmed by fillet
  // Use VERTICAL_DISTANCE from bottom point to right step point instead
  const rightStepPt = (await api.v1.sketch.getPoints({ id: L[2] })).result.endId  // (40,25)
  const botRightPt = (await api.v1.sketch.getPoints({ id: L[4] })).result.startId  // (40,0)
  await api.v1.sketch.dimension({ id: skId, type: 'VERTICAL_DISTANCE', geomIds: [botRightPt, rightStepPt] })
  // 6. From bottom to lower hole = 10 (VERTICAL_DISTANCE)
  await api.v1.sketch.dimension({ id: skId, type: 'VERTICAL_DISTANCE', geomIds: [botLeftPt, h2center] })
  // 7. R10 fillets
  await api.v1.sketch.dimension({ id: skId, type: 'RADIUS', geomIds: [f1.result[0]] })
  await api.v1.sketch.dimension({ id: skId, type: 'RADIUS', geomIds: [f2.result[0]] })
  // 8. Hole radii
  await api.v1.sketch.dimension({ id: skId, type: 'RADIUS', geomIds: [h1.result] })
  await api.v1.sketch.dimension({ id: skId, type: 'RADIUS', geomIds: [h2.result] })

  console.log('[11] all geometry + dimensions created')
  await snapshot('Z-bracket-final')

  return { partId, skId }
}
