// Test: Basic updateSketchRegion — create region with rect, update to triangle
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create rectangle geometry
  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result
  console.log('[01] rectIds:', rectIds)

  // Create region with rectangle
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds, name: 'MyRegion' })).result
  console.log('[01] regionId:', regionId)

  // Verify initial geometry
  const geomBefore = await api.v1.sketch.getGeometry({ id: regionId })
  console.log('[01] geomBefore:', JSON.stringify(geomBefore.result))
  filewrite({ geomBefore: geomBefore.result }, 'before-geom')

  await snapshot('before')

  // Create triangle geometry
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [-60, -10, 0], endPos: [-20, -10, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [-20, -10, 0], endPos: [-40, 30, 0] })).result
  const l3 = (await api.v1.sketch.line({ id: skId, startPos: [-40, 30, 0], endPos: [-60, -10, 0] })).result
  const triIds = [l1, l2, l3]
  console.log('[01] triIds:', triIds)

  // Update region to use triangle geometry
  const r = await api.v1.sketch.updateSketchRegion({ regions: [{ id: regionId, geomIds: triIds }] })
  console.log('[01] updateResult:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'update-response')

  // Verify updated geometry
  const geomAfter = await api.v1.sketch.getGeometry({ id: regionId })
  console.log('[01] geomAfter:', JSON.stringify(geomAfter.result))
  filewrite({ geomAfter: geomAfter.result }, 'after-geom')

  await snapshot('after')

  return { partId, regionId }
}
