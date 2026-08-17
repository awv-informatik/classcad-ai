// Test PARALLEL constraint between two lines
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Two non-parallel lines
  const line1Id = (await api.v1.sketch.line({
    id: skId,
    startPos: [0, 0, 0],
    endPos: [50, 10, 0],
    genFixation: false,
    genVertAndHoriz: false,
  })).result
  const line2Id = (await api.v1.sketch.line({
    id: skId,
    startPos: [0, 30, 0],
    endPos: [50, 50, 0],
    genFixation: false,
    genVertAndHoriz: false,
  })).result
  console.log('[04] line1Id:', line1Id, 'line2Id:', line2Id)

  const r = await api.v1.sketch.constraint({
    id: skId,
    type: 'PARALLEL',
    geomIds: [line1Id, line2Id],
  })
  console.log('[04] parallel result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'parallel-response')
  await snapshot('parallel')
  return { partId }
}
