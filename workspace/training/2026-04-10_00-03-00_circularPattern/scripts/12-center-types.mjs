// Test what types of center points work:
// - sketch point at origin
// - sketch point at non-origin
// - endpoint of a line (using getPoints)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create geometry to pattern
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [30, 0, 0], endPos: [50, 0, 0] })).result

  // Test 1: center point at non-origin position
  const offCenter = (await api.v1.sketch.point({ id: skId, pos: [10, 10, 0] })).result
  const rsId = (await api.v1.sketch.rigidSet({ id: skId, geomIds: [l1] })).result

  const r1 = await api.v1.sketch.circularPattern({
    id: skId, rigidSetId: rsId, centerId: offCenter,
    angle: Math.PI / 2, count: 4,
  })
  console.log('[12] off-center point maxLevel:', r1.maxLevel)
  await snapshot('off-center-pattern')

  // Test 2: use endpoint of a line as center
  // Get points of the line
  const partId2 = (await api.v1.part.create({ name: 'Test2' })).result
  const skId2 = (await api.v1.sketch.create({ id: partId2 })).result
  const l2 = (await api.v1.sketch.line({ id: skId2, startPos: [0, 0, 0], endPos: [20, 0, 0] })).result
  const l3 = (await api.v1.sketch.line({ id: skId2, startPos: [30, 0, 0], endPos: [50, 0, 0] })).result

  // Get the start point of l2 (should be at origin)
  const pts = await api.v1.sketch.getPoints({ id: l2 })
  console.log('[12] line points:', pts.result)

  const rsId2 = (await api.v1.sketch.rigidSet({ id: skId2, geomIds: [l3] })).result

  // Use the start point of the line as center
  if (pts.result && pts.result.length > 0) {
    const r2 = await api.v1.sketch.circularPattern({
      id: skId2, rigidSetId: rsId2, centerId: pts.result[0],
      angle: Math.PI / 3, count: 3,
    })
    console.log('[12] line-endpoint-center maxLevel:', r2.maxLevel)
    filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'line-endpoint-center')
    await snapshot('line-endpoint-center')
  }

  return { partId }
}
