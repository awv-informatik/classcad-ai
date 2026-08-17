// Test: Update region with the same geometry it already has (no-op?)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  // Update with the exact same geometry
  const r = await api.v1.sketch.updateSketchRegion({ regions: [{ id: regionId, geomIds: rectIds }] })
  console.log('[10] same-geom update result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[10] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'same-geom')

  // Verify still intact
  const geom = await api.v1.sketch.getGeometry({ id: regionId })
  console.log('[10] geom after same-update:', JSON.stringify(geom.result))

  return { partId }
}
