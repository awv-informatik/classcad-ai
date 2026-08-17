// Test EQUAL_LENGTH constraint between two lines
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Two lines of different lengths
  const line1Id = (await api.v1.sketch.line({
    id: skId, startPos: [0, 0, 0], endPos: [40, 0, 0],
    genFixation: false, genVertAndHoriz: false,
  })).result
  const line2Id = (await api.v1.sketch.line({
    id: skId, startPos: [0, 20, 0], endPos: [60, 20, 0],
    genFixation: false, genVertAndHoriz: false,
  })).result
  console.log('[08] line1Id:', line1Id, 'line2Id:', line2Id)

  // Get positions before
  const pos1Before = (await api.v1.sketch.getPositions({ id: line1Id })).result
  const pos2Before = (await api.v1.sketch.getPositions({ id: line2Id })).result
  console.log('[08] before - line1:', JSON.stringify(pos1Before), 'line2:', JSON.stringify(pos2Before))

  const r = await api.v1.sketch.constraint({
    id: skId, type: 'EQUAL_LENGTH', geomIds: [line1Id, line2Id],
  })
  console.log('[08] equal_length result:', r.result, 'maxLevel:', r.maxLevel)

  // Get positions after
  const pos1After = (await api.v1.sketch.getPositions({ id: line1Id })).result
  const pos2After = (await api.v1.sketch.getPositions({ id: line2Id })).result
  console.log('[08] after - line1:', JSON.stringify(pos1After), 'line2:', JSON.stringify(pos2After))

  filewrite({
    result: r.result, messages: r.messages, maxLevel: r.maxLevel,
    before: { line1: pos1Before, line2: pos2Before },
    after: { line1: pos1After, line2: pos2After },
  }, 'equal-length-response')
  await snapshot('equal-length')
  return { partId }
}
