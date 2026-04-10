// Test: Realistic workflow — create rectangle, move one corner via point updates
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a rectangle
  const rectR = await api.v1.sketch.rectangle({
    id: skId,
    startPos: [0, 0, 0],
    endPos: [60, 40, 0],
  })
  const rectIds = rectR.result
  console.log('[19] rectangle line IDs:', JSON.stringify(rectIds))

  // Get all corner point IDs
  const allPts = {}
  for (let i = 0; i < rectIds.length; i++) {
    const pts = await api.v1.sketch.getPoints({ id: rectIds[i] })
    allPts[`line${i}`] = pts.result
    console.log(`[19] line${i} points:`, JSON.stringify(pts.result))
  }

  await snapshot('before')

  // Update all 4 lines to resize the rectangle from 60x40 to 80x60
  const r = await api.v1.sketch.updateGeometry({
    id: skId,
    lines: [
      { id: rectIds[0], startPos: [0, 0, 0], endPos: [80, 0, 0] },    // bottom
      { id: rectIds[1], startPos: [80, 0, 0], endPos: [80, 60, 0] },   // right
      { id: rectIds[2], startPos: [80, 60, 0], endPos: [0, 60, 0] },   // top
      { id: rectIds[3], startPos: [0, 60, 0], endPos: [0, 0, 0] },     // left
    ],
  })
  console.log('[19] resize result:', r.result, 'maxLevel:', r.maxLevel)

  // Verify positions
  for (let i = 0; i < rectIds.length; i++) {
    const pos = await api.v1.sketch.getPositions({ id: rectIds[i] })
    console.log(`[19] line${i} after:`, JSON.stringify(pos.result))
  }

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'resize-response')

  await snapshot('after')

  return { partId }
}
