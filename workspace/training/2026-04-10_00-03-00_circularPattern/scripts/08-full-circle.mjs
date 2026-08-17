// Test full circle: angle = 2*PI / (count-1), so copies are evenly spaced around 360 degrees
// Also test: what if angle * (count-1) > 2*PI — do copies overlap?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [20, 0, 0], endPos: [40, 0, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [40, 0, 0], endPos: [40, 10, 0] })).result
  const centerPt = (await api.v1.sketch.point({ id: skId, pos: [0, 0, 0] })).result
  const rsId = (await api.v1.sketch.rigidSet({ id: skId, geomIds: [l1, l2] })).result

  // 6 copies evenly spaced at 60 degrees each = full circle
  const r = await api.v1.sketch.circularPattern({
    id: skId, rigidSetId: rsId, centerId: centerPt,
    angle: (2 * Math.PI) / 6,  // 60 degrees
    count: 6,
  })
  console.log('[08] full circle maxLevel:', r.maxLevel)
  console.log('[08] geometry count:', r.result?.geometry?.length)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'full-circle')
  await snapshot('full-circle-6-copies')

  return { partId }
}
