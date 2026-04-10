// Test passing a single geometry ID instead of a rigid set ID for rigidSetId
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Single line — pass directly as rigidSetId (no rigidSet call)
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [20, 0, 0], endPos: [40, 0, 0] })).result
  const centerPt = (await api.v1.sketch.point({ id: skId, pos: [0, 0, 0] })).result

  console.log('[09] line id:', l1, 'centerPt:', centerPt)

  const r = await api.v1.sketch.circularPattern({
    id: skId,
    rigidSetId: l1,  // single geometry, not a rigid set
    centerId: centerPt,
    angle: Math.PI / 3,  // 60 degrees
    count: 6,
  })
  console.log('[09] maxLevel:', r.maxLevel, 'result:', r.result)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'single-geom')

  if (r.result) await snapshot('single-geom-circular')
  return { partId }
}
