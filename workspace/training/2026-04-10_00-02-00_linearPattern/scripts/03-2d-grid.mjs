// Test 2D grid pattern (both X and Y)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'GridPatternTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a small circle to pattern
  const c = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 5 })).result
  console.log('[03] circle:', c)

  // Create rigid set from circle
  const rsId = (await api.v1.sketch.rigidSet({ id: skId, geomIds: [c] })).result
  console.log('[03] rigidSet:', rsId)

  // 3x2 grid: 3 along X, 2 along Y
  const r = await api.v1.sketch.linearPattern({
    id: skId,
    rigidSetId: rsId,
    xCount: 3,
    xDistance: 25,
    yCount: 2,
    yDistance: 30,
  })
  console.log('[03] maxLevel:', r.maxLevel)
  console.log('[03] constraint:', r.result.constraint)
  console.log('[03] dimensions:', r.result.dimensions)
  console.log('[03] geometry count:', r.result.geometry?.length)
  console.log('[03] geometry:', r.result.geometry)

  filewrite(r.result, 'grid-pattern-result')

  await snapshot('grid-3x2')

  return { partId }
}
