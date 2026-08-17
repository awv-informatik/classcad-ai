// Test: Update region with duplicate geometry IDs
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  // Update with duplicates of the first line
  const dupeIds = [rectIds[0], rectIds[0], rectIds[1]]
  const r = await api.v1.sketch.updateSketchRegion({ regions: [{ id: regionId, geomIds: dupeIds }] })
  console.log('[11] dupe update result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[11] messages:', JSON.stringify(r.messages))

  const geom = await api.v1.sketch.getGeometry({ id: regionId })
  console.log('[11] geom after dupe:', JSON.stringify(geom.result))
  filewrite({ result: r.result, maxLevel: r.maxLevel, geom: geom.result }, 'dupe-result')

  return { partId }
}
