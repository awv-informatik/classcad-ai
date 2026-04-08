// Test PERPENDICULAR constraint between two lines
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Two non-perpendicular lines sharing an endpoint
  const line1Id = (await api.v1.sketch.line({
    id: skId,
    startPos: [0, 0, 0],
    endPos: [50, 10, 0],
    genFixation: false,
    genVertAndHoriz: false,
    genIncidence: false,
  })).result
  const line2Id = (await api.v1.sketch.line({
    id: skId,
    startPos: [50, 10, 0],
    endPos: [60, 50, 0],
    genFixation: false,
    genVertAndHoriz: false,
    genIncidence: false,
  })).result
  console.log('[05] line1Id:', line1Id, 'line2Id:', line2Id)

  const r = await api.v1.sketch.constraint({
    id: skId,
    type: 'PERPENDICULAR',
    geomIds: [line1Id, line2Id],
  })
  console.log('[05] perpendicular result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'perpendicular-response')
  await snapshot('perpendicular')
  return { partId }
}
