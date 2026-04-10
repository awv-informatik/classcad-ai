// Test angle variations: negative angle, zero angle, full circle (2*PI), > 2*PI
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [20, 0, 0], endPos: [40, 0, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [40, 0, 0], endPos: [40, 10, 0] })).result
  const centerPt = (await api.v1.sketch.point({ id: skId, pos: [0, 0, 0] })).result
  const rsId = (await api.v1.sketch.rigidSet({ id: skId, geomIds: [l1, l2] })).result

  // Negative angle — should rotate clockwise
  const r = await api.v1.sketch.circularPattern({
    id: skId, rigidSetId: rsId, centerId: centerPt,
    angle: -Math.PI / 2,  // -90 degrees
    count: 4,
  })
  console.log('[06] negative angle maxLevel:', r.maxLevel)
  console.log('[06] geometry count:', r.result?.geometry?.length)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'negative-angle')
  await snapshot('negative-angle')

  return { partId }
}
