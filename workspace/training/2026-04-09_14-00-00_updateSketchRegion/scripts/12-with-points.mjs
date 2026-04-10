// Test: Update region with point IDs (sketch-point type)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  // Create a standalone point
  const ptId = (await api.v1.sketch.point({ id: skId, pos: [10, 10, 0] })).result
  console.log('[12] point id:', ptId)

  // Update with lines + point
  const r = await api.v1.sketch.updateSketchRegion({
    regions: [{ id: regionId, geomIds: [rectIds[0], rectIds[1], ptId] }],
  })
  console.log('[12] with-point result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[12] messages:', JSON.stringify(r.messages))

  const geom = await api.v1.sketch.getGeometry({ id: regionId })
  console.log('[12] geom after point:', JSON.stringify(geom.result))
  filewrite({ updateResult: { result: r.result, maxLevel: r.maxLevel, messages: r.messages }, geom: geom.result }, 'with-point')

  return { partId }
}
