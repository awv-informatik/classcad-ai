// Test multiple constraint types on the same geometry
// Build a practical constrained sketch: rectangle with equal sides and fixed corner
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'MultiConstraint' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Create 4 lines forming a rough quadrilateral (not a rectangle yet)
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [10, 5, 0], endPos: [70, 8, 0] })).result   // bottom
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [72, 10, 0], endPos: [68, 52, 0] })).result  // right
  const l3 = (await api.v1.sketch.line({ id: skId, startPos: [65, 55, 0], endPos: [12, 48, 0] })).result  // top
  const l4 = (await api.v1.sketch.line({ id: skId, startPos: [8, 45, 0], endPos: [12, 3, 0] })).result    // left

  // Get all endpoints
  const p1 = (await api.v1.sketch.getPoints({ id: l1 })).result
  const p2 = (await api.v1.sketch.getPoints({ id: l2 })).result
  const p3 = (await api.v1.sketch.getPoints({ id: l3 })).result
  const p4 = (await api.v1.sketch.getPoints({ id: l4 })).result

  await snapshot('before')

  // Step 1: Fix bottom-left corner
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [p1.startId] })

  // Step 2: Connect corners with COINCIDENT
  const coincR = await api.v1.sketch.constraint([
    { id: skId, type: 'COINCIDENT', geomIds: [p1.endId, p2.startId] },    // bottom-right
    { id: skId, type: 'COINCIDENT', geomIds: [p2.endId, p3.startId] },    // top-right
    { id: skId, type: 'COINCIDENT', geomIds: [p3.endId, p4.startId] },    // top-left
    { id: skId, type: 'COINCIDENT', geomIds: [p4.endId, p1.startId] },    // bottom-left
  ])
  console.log('[08] coincident results:', JSON.stringify(coincR.result), 'maxLevel:', coincR.maxLevel)

  // Step 3: Make it a rectangle (H+V)
  const hvR = await api.v1.sketch.constraint([
    { id: skId, type: 'HORIZONTAL', geomIds: [l1] },
    { id: skId, type: 'VERTICAL', geomIds: [l2] },
    { id: skId, type: 'HORIZONTAL', geomIds: [l3] },
    { id: skId, type: 'VERTICAL', geomIds: [l4] },
  ])
  console.log('[08] H+V results:', JSON.stringify(hvR.result), 'maxLevel:', hvR.maxLevel)

  // Step 4: Make it a square (EQUAL_LENGTH)
  const eqR = await api.v1.sketch.constraint({ id: skId, type: 'EQUAL_LENGTH', geomIds: [l1, l2] })
  console.log('[08] EQUAL_LENGTH result:', eqR.result, 'maxLevel:', eqR.maxLevel)

  await snapshot('after')

  // Measure final positions
  const corners = []
  for (const [name, pts] of [['l1', p1], ['l2', p2], ['l3', p3], ['l4', p4]]) {
    const s = (await api.v1.sketch.getPositions({ id: pts.startId })).result.pos
    const e = (await api.v1.sketch.getPositions({ id: pts.endId })).result.pos
    const len = Math.sqrt((e.x - s.x) ** 2 + (e.y - s.y) ** 2)
    console.log(`[08] ${name}: (${s.x.toFixed(1)},${s.y.toFixed(1)}) -> (${e.x.toFixed(1)},${e.y.toFixed(1)}) len=${len.toFixed(1)}`)
    corners.push({ name, start: [s.x, s.y], end: [e.x, e.y], length: len })
  }

  filewrite(corners, 'multi-constraint')

  return { partId }
}
