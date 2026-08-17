// Test dimensions with point geometry (not just curves)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DimTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create two points
  const pt1 = (await api.v1.sketch.point({ id: skId, pos: [10, 10, 0] })).result
  const pt2 = (await api.v1.sketch.point({ id: skId, pos: [70, 40, 0] })).result
  console.log('[14] pt1:', pt1, 'pt2:', pt2)

  // OFFSET between two points
  const r1 = await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [pt1, pt2] })
  console.log('[14] OFFSET 2-points result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[14] messages:', JSON.stringify(r1.messages))

  // HORIZONTAL_DISTANCE between two points
  const r2 = await api.v1.sketch.dimension({ id: skId, type: 'HORIZONTAL_DISTANCE', geomIds: [pt1, pt2] })
  console.log('[14] HORIZONTAL_DISTANCE 2-points result:', r2.result, 'maxLevel:', r2.maxLevel)

  // VERTICAL_DISTANCE between two points
  const r3 = await api.v1.sketch.dimension({ id: skId, type: 'VERTICAL_DISTANCE', geomIds: [pt1, pt2] })
  console.log('[14] VERTICAL_DISTANCE 2-points result:', r3.result, 'maxLevel:', r3.maxLevel)

  // OFFSET on a single point (should probably fail)
  const r4 = await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [pt1] })
  console.log('[14] OFFSET 1-point result:', r4.result, 'maxLevel:', r4.maxLevel)
  console.log('[14] OFFSET 1-point messages:', JSON.stringify(r4.messages))

  filewrite({
    offset2Pts: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    hDist2Pts: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    vDist2Pts: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
    offset1Pt: { result: r4.result, maxLevel: r4.maxLevel, messages: r4.messages },
  }, 'point-dim-responses')

  await snapshot('point-dims')
  return { partId, skId }
}
