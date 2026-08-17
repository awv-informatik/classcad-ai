// Test: Batch update — multiple regions in one call
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create two sets of geometry
  const rect1 = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [40, 30, 0] })).result
  const rect2 = (await api.v1.sketch.rectangle({ id: skId, startPos: [50, 0, 0], endPos: [90, 30, 0] })).result

  // Create two regions
  const region1 = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rect1, name: 'Region1' })).result
  const region2 = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rect2, name: 'Region2' })).result
  console.log('[05] region1:', region1, 'region2:', region2)

  // Create new geometry
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, -20, 0], endPos: [30, -20, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [30, -20, 0], endPos: [15, -5, 0] })).result
  const l3 = (await api.v1.sketch.line({ id: skId, startPos: [15, -5, 0], endPos: [0, -20, 0] })).result
  const tri = [l1, l2, l3]

  const c1 = (await api.v1.sketch.circle({ id: skId, centerPos: [70, -15, 0], radius: 12 })).result
  console.log('[05] tri:', tri, 'circle:', c1)

  // Batch update both regions
  const r = await api.v1.sketch.updateSketchRegion({
    regions: [
      { id: region1, geomIds: tri },
      { id: region2, geomIds: [c1] },
    ],
  })
  console.log('[05] batch result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[05] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'batch-response')

  // Verify both regions
  const geom1 = await api.v1.sketch.getGeometry({ id: region1 })
  const geom2 = await api.v1.sketch.getGeometry({ id: region2 })
  console.log('[05] region1 geom:', JSON.stringify(geom1.result))
  console.log('[05] region2 geom:', JSON.stringify(geom2.result))
  filewrite({ region1: geom1.result, region2: geom2.result }, 'batch-geom')

  await snapshot('batch')

  return { partId }
}
