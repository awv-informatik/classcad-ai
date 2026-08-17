// Test: Update region with geometry from a different sketch
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId1 = (await api.v1.sketch.create({ id: partId })).result
  const skId2 = (await api.v1.sketch.create({ id: partId })).result

  // Create geometry in sketch 1
  const rectIds = (await api.v1.sketch.rectangle({ id: skId1, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId1, geomIds: rectIds })).result

  // Create geometry in sketch 2
  const lineIds = []
  lineIds.push((await api.v1.sketch.line({ id: skId2, startPos: [0, 0, 0], endPos: [40, 0, 0] })).result)
  lineIds.push((await api.v1.sketch.line({ id: skId2, startPos: [40, 0, 0], endPos: [20, 30, 0] })).result)
  lineIds.push((await api.v1.sketch.line({ id: skId2, startPos: [20, 30, 0], endPos: [0, 0, 0] })).result)

  console.log('[09] region in sketch1:', regionId, 'geom from sketch2:', lineIds)

  // Try to update region in sketch1 with geom from sketch2
  const r = await api.v1.sketch.updateSketchRegion({ regions: [{ id: regionId, geomIds: lineIds }] })
  console.log('[09] cross-sketch result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[09] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'cross-sketch')

  // Check what the region contains now
  const geom = await api.v1.sketch.getGeometry({ id: regionId })
  console.log('[09] geom after cross-sketch:', JSON.stringify(geom.result))
  filewrite(geom.result, 'cross-sketch-geom')

  return { partId }
}
