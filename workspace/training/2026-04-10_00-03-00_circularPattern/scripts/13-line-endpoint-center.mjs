// Test using a line endpoint as the center point for circular pattern
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a center line and get its start point
  const centerLine = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [0, 30, 0] })).result
  const pts = await api.v1.sketch.getPoints({ id: centerLine })
  console.log('[13] centerLine points:', pts.result)

  // Create geometry to pattern
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [20, 0, 0], endPos: [40, 0, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [40, 0, 0], endPos: [40, 15, 0] })).result
  const rsId = (await api.v1.sketch.rigidSet({ id: skId, geomIds: [l1, l2] })).result

  // Use the start point of the center line as center
  const r = await api.v1.sketch.circularPattern({
    id: skId, rigidSetId: rsId, centerId: pts.result.startId,
    angle: Math.PI / 3,  // 60 degrees
    count: 6,
  })
  console.log('[13] maxLevel:', r.maxLevel, 'geometry count:', r.result?.geometry?.length)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'line-endpoint')
  if (r.result) await snapshot('line-endpoint-center-6-copies')

  return { partId }
}
