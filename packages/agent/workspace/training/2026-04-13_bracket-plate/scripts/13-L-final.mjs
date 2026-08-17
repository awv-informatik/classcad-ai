// L-bracket — lower-left corner cut away, right side STRAIGHT
// Profile: (0,75) → (60,75) → (60,0) → (20,0) → (20,25) → (0,25) → (0,75)
// R10 fillet at inner corner (20,25)
// Upper hole at (30,55), lower hole at (30,10)
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'BracketPlate' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const verts = [
    [0, 75, 0],   // top-left
    [60, 75, 0],  // top-right
    [60, 0, 0],   // bottom-right
    [20, 0, 0],   // bottom-left (step)
    [20, 25, 0],  // step inner corner
    [0, 25, 0],   // step shelf end
  ]
  const L = []
  for (let i = 0; i < verts.length; i++) {
    const r = await api.v1.sketch.line({
      id: skId, startPos: verts[i], endPos: verts[(i + 1) % verts.length],
    })
    L.push(r.result)
  }
  // L0=top, L1=right, L2=bottom, L3=stepWall, L4=stepShelf, L5=left

  // R10 fillet at inner corner (20,25): L3 (step wall up) meets L4 (step shelf left)
  const f = await api.v1.sketch.fillet({ id: skId, lineIds: [L[3], L[4]], radius: 10 })
  console.log('[13] fillet:', f.result ? '✓' : '✗')

  // Holes
  const h1 = await api.v1.sketch.circle({ id: skId, centerPos: [30, 55, 0], radius: 5 })
  const h2 = await api.v1.sketch.circle({ id: skId, centerPos: [30, 10, 0], radius: 5 })

  // Dimensions
  const h1c = (await api.v1.sketch.getPoints({ id: h1.result })).result.centerId
  const h2c = (await api.v1.sketch.getPoints({ id: h2.result })).result.centerId
  const topLeftPt = (await api.v1.sketch.getPoints({ id: L[0] })).result.startId    // (0,75)
  const botStepPt = (await api.v1.sketch.getPoints({ id: L[3] })).result.startId    // (20,0)
  // Use L5 (left edge) start point at (0,25) — untrimmed by fillet
  const stepShelfPt = (await api.v1.sketch.getPoints({ id: L[5] })).result.startId  // (0,25)
  const botRightPt = (await api.v1.sketch.getPoints({ id: L[2] })).result.startId   // (60,0)

  // 60 — overall width
  await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [L[0]] })
  // 30 — from left to upper hole
  await api.v1.sketch.dimension({ id: skId, type: 'HORIZONTAL_DISTANCE', geomIds: [topLeftPt, h1c] })
  // 20 — from top to upper hole
  await api.v1.sketch.dimension({ id: skId, type: 'VERTICAL_DISTANCE', geomIds: [topLeftPt, h1c] })
  // 30 — from upper hole to step shelf (middle section)
  await api.v1.sketch.dimension({ id: skId, type: 'VERTICAL_DISTANCE', geomIds: [h1c, stepShelfPt] })
  // 25 — from bottom to step shelf
  await api.v1.sketch.dimension({ id: skId, type: 'VERTICAL_DISTANCE', geomIds: [botRightPt, stepShelfPt] })
  // 10 — from bottom to lower hole
  await api.v1.sketch.dimension({ id: skId, type: 'VERTICAL_DISTANCE', geomIds: [botStepPt, h2c] })
  // R10 fillet
  await api.v1.sketch.dimension({ id: skId, type: 'RADIUS', geomIds: [f.result[0]] })
  // R5 holes
  await api.v1.sketch.dimension({ id: skId, type: 'RADIUS', geomIds: [h1.result] })
  await api.v1.sketch.dimension({ id: skId, type: 'RADIUS', geomIds: [h2.result] })

  console.log('[13] done')
  await snapshot('L-final')
  return { partId, skId }
}
