// Test basic linearPattern along X axis
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'LinearPatternTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create an L-shape to pattern
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [15, 0, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [15, 0, 0], endPos: [15, 10, 0] })).result
  console.log('[01] l1:', l1, 'l2:', l2)

  // Create rigid set
  const rsId = (await api.v1.sketch.rigidSet({ id: skId, geomIds: [l1, l2] })).result
  console.log('[01] rigidSet:', rsId)

  // Pattern 3 copies along X with 30mm spacing
  const r = await api.v1.sketch.linearPattern({
    id: skId,
    rigidSetId: rsId,
    xCount: 3,
    xDistance: 30,
  })
  console.log('[01] maxLevel:', r.maxLevel)
  console.log('[01] result keys:', Object.keys(r.result))
  console.log('[01] constraint:', r.result.constraint)
  console.log('[01] dimensions:', r.result.dimensions)
  console.log('[01] geometry count:', r.result.geometry?.length)
  console.log('[01] geometry:', r.result.geometry)

  filewrite(r.result, 'x-pattern-result')
  filewrite(r.messages, 'x-pattern-messages')

  await snapshot('x-pattern-3-copies')

  return { partId, skId, rsId, patternResult: r.result }
}
