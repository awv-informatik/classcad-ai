// Test: Update a region to empty geomIds
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result
  console.log('[02] regionId:', regionId)

  // Update to empty
  const r = await api.v1.sketch.updateSketchRegion({ regions: [{ id: regionId, geomIds: [] }] })
  console.log('[02] empty update result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[02] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'empty-update')

  // Verify geometry after empty update
  const geom = await api.v1.sketch.getGeometry({ id: regionId })
  console.log('[02] geom after empty:', JSON.stringify(geom.result))
  filewrite({ geom: geom.result }, 'geom-after-empty')

  return { partId, regionId }
}
