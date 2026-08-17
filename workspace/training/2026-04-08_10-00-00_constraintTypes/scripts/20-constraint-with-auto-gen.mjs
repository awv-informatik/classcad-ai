// Test: do constraints work when geometry is created WITH auto-constraints?
// Maybe auto-generated constraints cause the solver to run, and adding manual
// constraints on already-solved geometry works differently.
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a rectangle with auto-constraints enabled
  const rect = (await api.v1.sketch.rectangle({
    id: skId, startPos: [0, 0, 0], endPos: [60, 40, 0],
  })).result
  console.log('[20] rectangle IDs:', rect)

  // Check rectangle positions
  for (let i = 0; i < rect.length; i++) {
    const pts = (await api.v1.sketch.getPoints({ id: rect[i] })).result
    const startP = (await api.v1.sketch.getPositions({ id: pts.startId })).result
    const endP = (await api.v1.sketch.getPositions({ id: pts.endId })).result
    console.log(`[20] rect[${i}] start: [${startP.pos.x}, ${startP.pos.y}] end: [${endP.pos.x}, ${endP.pos.y}]`)
  }

  // Add EQUAL_LENGTH between two sides
  const rEL = await api.v1.sketch.constraint({
    id: skId, type: 'EQUAL_LENGTH', geomIds: [rect[0], rect[1]],
  })
  console.log('[20] EQUAL_LENGTH result:', rEL.result, 'maxLevel:', rEL.maxLevel)

  // Check if the rectangle changed shape
  for (let i = 0; i < rect.length; i++) {
    const pts = (await api.v1.sketch.getPoints({ id: rect[i] })).result
    const startP = (await api.v1.sketch.getPositions({ id: pts.startId })).result
    const endP = (await api.v1.sketch.getPositions({ id: pts.endId })).result
    console.log(`[20] AFTER rect[${i}] start: [${startP.pos.x}, ${startP.pos.y}] end: [${endP.pos.x}, ${endP.pos.y}]`)
  }

  // Now try moveGeometry on the rectangle
  const rMove = await api.v1.sketch.moveGeometry({
    id: skId, geomIds: [rect[0]], translation: [0, 5, 0],
  })
  console.log('[20] moveGeometry result:', rMove.result)

  // Check after move
  for (let i = 0; i < rect.length; i++) {
    const pts = (await api.v1.sketch.getPoints({ id: rect[i] })).result
    const startP = (await api.v1.sketch.getPositions({ id: pts.startId })).result
    const endP = (await api.v1.sketch.getPositions({ id: pts.endId })).result
    console.log(`[20] MOVED rect[${i}] start: [${startP.pos.x}, ${startP.pos.y}] end: [${endP.pos.x}, ${endP.pos.y}]`)
  }

  return { partId }
}
