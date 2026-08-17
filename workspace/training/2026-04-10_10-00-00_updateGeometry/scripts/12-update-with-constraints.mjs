// Test: Does updateGeometry respect/interact with existing constraints?
// Create a rectangle (4 lines with auto-constraints), then try to move one line.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a rectangle with full auto-constraints
  const rectR = await api.v1.sketch.rectangle({
    id: skId,
    startPos: [0, 0, 0],
    endPos: [60, 40, 0],
  })
  const rectIds = rectR.result
  console.log('[12] rectangle line IDs:', JSON.stringify(rectIds))

  // Get positions of first line (bottom line)
  const posBefore = await api.v1.sketch.getPositions({ id: rectIds[0] })
  console.log('[12] bottom line before:', JSON.stringify(posBefore.result))

  await snapshot('before')

  // Try to move the bottom line up by 10
  const r = await api.v1.sketch.updateGeometry({
    id: skId,
    lines: [{ id: rectIds[0], startPos: [0, 10, 0], endPos: [60, 10, 0] }],
  })
  console.log('[12] updateGeometry result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[12] messages:', JSON.stringify(r.messages))

  // Check all 4 line positions after
  const positionsAfter = {}
  for (let i = 0; i < rectIds.length; i++) {
    const pos = await api.v1.sketch.getPositions({ id: rectIds[i] })
    positionsAfter[`line${i}`] = pos.result
    console.log(`[12] line${i} after:`, JSON.stringify(pos.result))
  }

  filewrite({ bottomLineBefore: posBefore.result, positionsAfter }, 'constraint-interaction')

  await snapshot('after')

  return { partId }
}
