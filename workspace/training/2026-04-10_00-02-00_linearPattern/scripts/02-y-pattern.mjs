// Test linearPattern along Y axis only
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'YPatternTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a small rectangle to pattern
  const rect = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [10, 8, 0] })).result
  console.log('[02] rectangle:', rect)

  // Create rigid set from rectangle lines
  const rsId = (await api.v1.sketch.rigidSet({ id: skId, geomIds: rect })).result
  console.log('[02] rigidSet:', rsId)

  // Pattern 4 copies along Y with 20mm spacing
  const r = await api.v1.sketch.linearPattern({
    id: skId,
    rigidSetId: rsId,
    yCount: 4,
    yDistance: 20,
  })
  console.log('[02] maxLevel:', r.maxLevel)
  console.log('[02] constraint:', r.result.constraint)
  console.log('[02] dimensions:', r.result.dimensions)
  console.log('[02] geometry count:', r.result.geometry?.length)
  console.log('[02] geometry:', r.result.geometry)

  filewrite(r.result, 'y-pattern-result')

  await snapshot('y-pattern-4-copies')

  return { partId }
}
