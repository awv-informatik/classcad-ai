// Basic circularPattern — happy path with rigid set, center point, angle, count
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create an L-shaped geometry
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [20, 0, 0], endPos: [40, 0, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [40, 0, 0], endPos: [40, 10, 0] })).result

  // Create a center point at origin
  const centerPt = (await api.v1.sketch.point({ id: skId, pos: [0, 0, 0] })).result
  console.log('[01] centerPt:', centerPt)

  // Group into rigid set
  const rsId = (await api.v1.sketch.rigidSet({ id: skId, geomIds: [l1, l2] })).result
  console.log('[01] rsId:', rsId)

  // Circular pattern: 4 copies at 90 degrees (PI/2) apart
  const r = await api.v1.sketch.circularPattern({
    id: skId,
    rigidSetId: rsId,
    centerId: centerPt,
    angle: Math.PI / 2,
    count: 4,
  })

  console.log('[01] maxLevel:', r.maxLevel)
  console.log('[01] result:', r.result)

  filewrite({
    result: r.result,
    messages: r.messages,
    maxLevel: r.maxLevel,
  }, 'basic-response')

  if (r.result) {
    console.log('[01] constraint:', r.result.constraint)
    console.log('[01] dimension:', r.result.dimension)
    console.log('[01] geometry count:', r.result.geometry?.length)
    console.log('[01] geometry:', r.result.geometry)
    await snapshot('basic-circular-pattern')
  }

  return { partId }
}
