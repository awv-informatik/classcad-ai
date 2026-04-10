// Test HORIZONTAL_DISTANCE and VERTICAL_DISTANCE dimension types
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DimTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [10, 10, 0], endPos: [80, 50, 0] })).result
  console.log('[02] rectIds:', rectIds)

  // HORIZONTAL_DISTANCE on the bottom line
  const r1 = await api.v1.sketch.dimension({ id: skId, type: 'HORIZONTAL_DISTANCE', geomIds: [rectIds[0]] })
  console.log('[02] HORIZONTAL_DISTANCE 1-line result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[02] messages:', JSON.stringify(r1.messages))

  // VERTICAL_DISTANCE on the left line
  const r2 = await api.v1.sketch.dimension({ id: skId, type: 'VERTICAL_DISTANCE', geomIds: [rectIds[1]] })
  console.log('[02] VERTICAL_DISTANCE 1-line result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[02] messages:', JSON.stringify(r2.messages))

  // HORIZONTAL_DISTANCE between two points (get point IDs)
  // Try with two vertical lines (parallel) - should measure horizontal distance between them
  const r3 = await api.v1.sketch.dimension({ id: skId, type: 'HORIZONTAL_DISTANCE', geomIds: [rectIds[1], rectIds[3]] })
  console.log('[02] HORIZONTAL_DISTANCE 2-lines result:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[02] h-dist-2lines messages:', JSON.stringify(r3.messages))

  filewrite({
    horizDist1Line: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    vertDist1Line: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    horizDist2Lines: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
  }, 'horiz-vert-responses')

  await snapshot('horiz-vert')
  return { partId, skId }
}
