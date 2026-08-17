// Test: Batch update where one region update is valid and one has invalid geomIds
// Does the valid one succeed or does the whole batch fail?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const rect1 = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [40, 30, 0] })).result
  const rect2 = (await api.v1.sketch.rectangle({ id: skId, startPos: [50, 0, 0], endPos: [90, 30, 0] })).result

  const region1 = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rect1, name: 'R1' })).result
  const region2 = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rect2, name: 'R2' })).result

  // New valid geometry for region1
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, -20, 0], endPos: [30, -20, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [30, -20, 0], endPos: [15, -5, 0] })).result
  const l3 = (await api.v1.sketch.line({ id: skId, startPos: [15, -5, 0], endPos: [0, -20, 0] })).result

  // Batch: region1 gets valid geom, region2 gets invalid (partId)
  const r = await api.v1.sketch.updateSketchRegion({
    regions: [
      { id: region1, geomIds: [l1, l2, l3] },
      { id: region2, geomIds: [partId] },  // invalid type
    ],
  })
  console.log('[13] batch result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[13] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'partial-batch')

  // Check both regions
  const geom1 = await api.v1.sketch.getGeometry({ id: region1 })
  const geom2 = await api.v1.sketch.getGeometry({ id: region2 })
  console.log('[13] region1 geom:', JSON.stringify(geom1.result))
  console.log('[13] region2 geom:', JSON.stringify(geom2.result))
  filewrite({ region1: geom1.result, region2: geom2.result }, 'partial-batch-geom')

  return { partId }
}
