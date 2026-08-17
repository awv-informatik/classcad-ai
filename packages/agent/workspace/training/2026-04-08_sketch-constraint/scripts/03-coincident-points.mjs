// Test COINCIDENT constraint between two points
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Two separate lines, not connected
  const line1Id = (await api.v1.sketch.line({
    id: skId,
    startPos: [0, 0, 0],
    endPos: [40, 0, 0],
    genFixation: false,
    genIncidence: false,
    genVertAndHoriz: false,
  })).result
  const line2Id = (await api.v1.sketch.line({
    id: skId,
    startPos: [50, 10, 0],
    endPos: [50, 50, 0],
    genFixation: false,
    genIncidence: false,
    genVertAndHoriz: false,
  })).result
  console.log('[03] line1Id:', line1Id, 'line2Id:', line2Id)

  // getPoints takes geometry ID directly, returns {startId, endId} for lines
  const pts1 = (await api.v1.sketch.getPoints({ id: line1Id })).result
  const pts2 = (await api.v1.sketch.getPoints({ id: line2Id })).result
  console.log('[03] line1 points:', JSON.stringify(pts1), 'line2 points:', JSON.stringify(pts2))

  // Constrain endpoint of line1 to startpoint of line2
  const r = await api.v1.sketch.constraint({
    id: skId,
    type: 'COINCIDENT',
    geomIds: [pts1.endId, pts2.startId],
  })
  console.log('[03] coincident result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[03] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'coincident-response')

  await snapshot('coincident')
  return { partId }
}
