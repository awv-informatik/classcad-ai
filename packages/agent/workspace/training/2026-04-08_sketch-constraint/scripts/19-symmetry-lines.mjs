// Test SYMMETRY constraint with two lines (not just points)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Symmetry axis
  const axisId = (await api.v1.sketch.line({
    id: skId, startPos: [40, 0, 0], endPos: [40, 60, 0],
    genFixation: false, genVertAndHoriz: false,
  })).result

  // Two lines to make symmetric
  const l1Id = (await api.v1.sketch.line({
    id: skId, startPos: [10, 10, 0], endPos: [30, 40, 0],
    genFixation: false, genVertAndHoriz: false,
  })).result
  const l2Id = (await api.v1.sketch.line({
    id: skId, startPos: [55, 15, 0], endPos: [70, 45, 0],
    genFixation: false, genVertAndHoriz: false,
  })).result
  console.log('[19] axisId:', axisId, 'l1Id:', l1Id, 'l2Id:', l2Id)

  // SYMMETRY: [axis, geom1, geom2]
  const r = await api.v1.sketch.constraint({
    id: skId, type: 'SYMMETRY', geomIds: [axisId, l1Id, l2Id],
  })
  console.log('[19] symmetry-lines result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[19] messages:', JSON.stringify(r.messages))

  const pos1 = (await api.v1.sketch.getPositions({ id: l1Id })).result
  const pos2 = (await api.v1.sketch.getPositions({ id: l2Id })).result
  console.log('[19] after - l1:', JSON.stringify(pos1), 'l2:', JSON.stringify(pos2))

  filewrite({
    result: r.result, messages: r.messages, maxLevel: r.maxLevel,
    after: { l1: pos1, l2: pos2 },
  }, 'symmetry-lines-response')
  await snapshot('symmetry-lines')
  return { partId }
}
