// Test angle=0 — all copies stacked at same position
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [20, 0, 0], endPos: [40, 0, 0] })).result
  const centerPt = (await api.v1.sketch.point({ id: skId, pos: [0, 0, 0] })).result
  const rsId = (await api.v1.sketch.rigidSet({ id: skId, geomIds: [l1] })).result

  const r = await api.v1.sketch.circularPattern({
    id: skId, rigidSetId: rsId, centerId: centerPt,
    angle: 0,
    count: 3,
  })
  console.log('[07] angle=0 maxLevel:', r.maxLevel, 'geometry:', r.result?.geometry?.length)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'zero-angle')
  return { partId }
}
