// Test SYMMETRY constraint — two points symmetric about a line
// Corrected: geomIds order is [symmetryLine, geom1, geom2]
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Symmetry axis (vertical line at x=40)
  const axisId = (await api.v1.sketch.line({
    id: skId, startPos: [40, 0, 0], endPos: [40, 60, 0],
    genFixation: false, genVertAndHoriz: false,
  })).result

  // Two points not yet symmetric
  const pt1Id = (await api.v1.sketch.point({
    id: skId, pos: [20, 30, 0],
    genFixation: false, genIncidence: false,
  })).result
  const pt2Id = (await api.v1.sketch.point({
    id: skId, pos: [65, 35, 0],
    genFixation: false, genIncidence: false,
  })).result
  console.log('[12] axisId:', axisId, 'pt1Id:', pt1Id, 'pt2Id:', pt2Id)

  // Correct order: [symmetryLine, geom1, geom2]
  const r = await api.v1.sketch.constraint({
    id: skId, type: 'SYMMETRY', geomIds: [axisId, pt1Id, pt2Id],
  })
  console.log('[12] symmetry result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[12] messages:', JSON.stringify(r.messages))

  // Check positions after
  const pos1 = (await api.v1.sketch.getPositions({ id: pt1Id })).result
  const pos2 = (await api.v1.sketch.getPositions({ id: pt2Id })).result
  console.log('[12] after - pt1:', JSON.stringify(pos1), 'pt2:', JSON.stringify(pos2))

  filewrite({
    result: r.result, messages: r.messages, maxLevel: r.maxLevel,
    after: { pt1: pos1, pt2: pos2 },
  }, 'symmetry-response')
  await snapshot('symmetry')
  return { partId }
}
