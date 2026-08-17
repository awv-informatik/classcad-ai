// Z-shape bracket plate — exact replication with all drawing dimensions
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'BracketPlate' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Z-shape profile (clockwise from top-left):
  // (0,75) → (60,75) → (60,25) → (40,25) → (40,0) → (20,0) → (20,55) → (0,55) → (0,75)
  const verts = [
    [0, 75, 0], [60, 75, 0], [60, 25, 0], [40, 25, 0],
    [40, 0, 0], [20, 0, 0], [20, 55, 0], [0, 55, 0],
  ]
  const L = []
  for (let i = 0; i < verts.length; i++) {
    const r = await api.v1.sketch.line({
      id: skId, startPos: verts[i], endPos: verts[(i + 1) % verts.length],
    })
    L.push(r.result)
  }

  // R10 fillets at inner corners
  const f1 = await api.v1.sketch.fillet({ id: skId, lineIds: [L[5], L[6]], radius: 10 })
  const f2 = await api.v1.sketch.fillet({ id: skId, lineIds: [L[2], L[3]], radius: 10 })

  // Holes
  const h1 = await api.v1.sketch.circle({ id: skId, centerPos: [30, 55, 0], radius: 5 })
  const h2 = await api.v1.sketch.circle({ id: skId, centerPos: [30, 10, 0], radius: 5 })

  // --- ALL DIMENSIONS matching the drawing ---
  const h1c = (await api.v1.sketch.getPoints({ id: h1.result })).result.centerId
  const h2c = (await api.v1.sketch.getPoints({ id: h2.result })).result.centerId
  const topLeftPt = (await api.v1.sketch.getPoints({ id: L[0] })).result.startId     // (0,75)
  const botLeftPt = (await api.v1.sketch.getPoints({ id: L[5] })).result.startId      // (20,0)
  const rightStepPt = (await api.v1.sketch.getPoints({ id: L[2] })).result.endId      // (40,25)
  const botRightPt = (await api.v1.sketch.getPoints({ id: L[4] })).result.startId     // (40,0)

  // 60 — top width (OFFSET on top edge)
  await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [L[0]] })
  // 30 — from left to upper hole (HORIZONTAL_DISTANCE)
  await api.v1.sketch.dimension({ id: skId, type: 'HORIZONTAL_DISTANCE', geomIds: [topLeftPt, h1c] })
  // 20 — from top to upper hole (VERTICAL_DISTANCE)
  await api.v1.sketch.dimension({ id: skId, type: 'VERTICAL_DISTANCE', geomIds: [topLeftPt, h1c] })
  // 30 — from upper hole to right step = middle section height (VERTICAL_DISTANCE)
  await api.v1.sketch.dimension({ id: skId, type: 'VERTICAL_DISTANCE', geomIds: [h1c, rightStepPt] })
  // 25 — from bottom to right step (VERTICAL_DISTANCE)
  await api.v1.sketch.dimension({ id: skId, type: 'VERTICAL_DISTANCE', geomIds: [botRightPt, rightStepPt] })
  // 10 — from bottom to lower hole (VERTICAL_DISTANCE)
  await api.v1.sketch.dimension({ id: skId, type: 'VERTICAL_DISTANCE', geomIds: [botLeftPt, h2c] })
  // R10 — fillet radii
  await api.v1.sketch.dimension({ id: skId, type: 'RADIUS', geomIds: [f1.result[0]] })
  await api.v1.sketch.dimension({ id: skId, type: 'RADIUS', geomIds: [f2.result[0]] })
  // R5 — hole radii
  await api.v1.sketch.dimension({ id: skId, type: 'RADIUS', geomIds: [h1.result] })
  await api.v1.sketch.dimension({ id: skId, type: 'RADIUS', geomIds: [h2.result] })

  console.log('[12] done')
  await snapshot('Z-final')

  return { partId, skId }
}
