// Test updating the angle dimension after creation
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [20, 0, 0], endPos: [40, 0, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [40, 0, 0], endPos: [40, 10, 0] })).result
  const centerPt = (await api.v1.sketch.point({ id: skId, pos: [0, 0, 0] })).result
  const rsId = (await api.v1.sketch.rigidSet({ id: skId, geomIds: [l1, l2] })).result

  // Create pattern with 4 copies at 45 degrees
  const r = await api.v1.sketch.circularPattern({
    id: skId, rigidSetId: rsId, centerId: centerPt,
    angle: Math.PI / 4,  // 45 degrees
    count: 4,
  })
  console.log('[10] initial maxLevel:', r.maxLevel)
  console.log('[10] dimension id:', r.result.dimension)
  await snapshot('before-update')

  // Update dimension to 90 degrees
  const upd = await api.v1.sketch.updateDimension({ id: r.result.dimension, value: Math.PI / 2 })
  console.log('[10] update maxLevel:', upd.maxLevel)
  filewrite({ updateResult: upd.result, updateMessages: upd.messages, updateMaxLevel: upd.maxLevel }, 'update-result')
  await snapshot('after-update-90deg')

  return { partId }
}
