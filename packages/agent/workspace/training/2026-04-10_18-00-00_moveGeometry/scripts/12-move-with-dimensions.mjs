// 12 — Move geometry that has dimensions (distance/length constraints)
// Test: does the dimension survive the move?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a line and add a length dimension
  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [10, 10, 0], endPos: [60, 10, 0] })).result
  console.log('[12] lineId:', lineId)

  // Add horizontal dimension
  const dimR = await api.v1.sketch.dimension({
    id: skId,
    type: 'HORIZONTAL',
    geomId1: lineId,
    textPos: [35, -10, 0],
  })
  console.log('[12] dimension result:', dimR.result, 'maxLevel:', dimR.maxLevel)

  await snapshot('before')

  // Move the line
  const r = await api.v1.sketch.moveGeometry({ id: skId, geomIds: [lineId], translation: [20, 30, 0] })
  console.log('[12] moveGeometry result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[12] messages:', JSON.stringify(r.messages))

  const after = (await api.v1.sketch.getPositions({ id: lineId })).result
  console.log('[12] line after:', JSON.stringify(after))

  filewrite({ moveResult: r.result, maxLevel: r.maxLevel, messages: r.messages, lineAfter: after }, 'move-with-dimension')

  await snapshot('after')

  return { partId }
}
