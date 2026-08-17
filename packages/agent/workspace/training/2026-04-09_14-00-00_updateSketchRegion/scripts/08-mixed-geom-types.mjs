// Test: Update region with mixed geometry types (lines + arcs + circles)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Start with rectangle
  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  // Create mixed geometry: line + arc + circle
  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [-50, 0, 0], endPos: [-20, 0, 0] })).result
  const arcId = (await api.v1.sketch.arcByCenter({ id: skId, startPos: [-20, 0, 0], endPos: [-50, 0, 0], centerPos: [-35, 15, 0] })).result
  const circleId = (await api.v1.sketch.circle({ id: skId, centerPos: [0, -30, 0], radius: 15 })).result

  console.log('[08] line:', lineId, 'arc:', arcId, 'circle:', circleId)

  // Update region with mixed types
  const r = await api.v1.sketch.updateSketchRegion({
    regions: [{ id: regionId, geomIds: [lineId, arcId, circleId] }],
  })
  console.log('[08] mixed update result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'mixed-response')

  // Verify all types show up
  const geom = await api.v1.sketch.getGeometry({ id: regionId })
  console.log('[08] geom after mixed:', JSON.stringify(geom.result))
  filewrite(geom.result, 'mixed-geom')

  await snapshot('mixed')

  return { partId }
}
