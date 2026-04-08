// Test EQUAL_RADIUS constraint between two circles
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Two circles with different radii
  const c1Id = (await api.v1.sketch.circle({
    id: skId, centerPos: [20, 30, 0], radius: 15,
    genFixation: false,
  })).result
  const c2Id = (await api.v1.sketch.circle({
    id: skId, centerPos: [60, 30, 0], radius: 25,
    genFixation: false,
  })).result
  console.log('[11] c1Id:', c1Id, 'c2Id:', c2Id)

  // Get positions before
  const pos1Before = (await api.v1.sketch.getPositions({ id: c1Id })).result
  const pos2Before = (await api.v1.sketch.getPositions({ id: c2Id })).result
  console.log('[11] before c1:', JSON.stringify(pos1Before), 'c2:', JSON.stringify(pos2Before))

  const r = await api.v1.sketch.constraint({
    id: skId, type: 'EQUAL_RADIUS', geomIds: [c1Id, c2Id],
  })
  console.log('[11] equal_radius result:', r.result, 'maxLevel:', r.maxLevel)

  // Get positions after
  const pos1After = (await api.v1.sketch.getPositions({ id: c1Id })).result
  const pos2After = (await api.v1.sketch.getPositions({ id: c2Id })).result
  console.log('[11] after c1:', JSON.stringify(pos1After), 'c2:', JSON.stringify(pos2After))

  filewrite({
    result: r.result, messages: r.messages, maxLevel: r.maxLevel,
    before: { c1: pos1Before, c2: pos2Before },
    after: { c1: pos1After, c2: pos2After },
  }, 'equal-radius-response')
  await snapshot('equal-radius')
  return { partId }
}
