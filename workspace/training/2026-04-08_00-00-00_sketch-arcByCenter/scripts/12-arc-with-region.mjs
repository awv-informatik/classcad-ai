// 12 — Arc + line to create a closed profile, then sketchRegion
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RegionTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a half circle arc from left to right
  const arcId = (await api.v1.sketch.arcByCenter({
    id: skId,
    startPos: [-40, 0, 0],
    centerPos: [0, 0, 0],
    endPos: [40, 0, 0],
  })).result
  console.log('[12] arc:', arcId)

  // Close with a line from endPos back to startPos
  const lineId = (await api.v1.sketch.line({
    id: skId,
    startPos: [40, 0, 0],
    endPos: [-40, 0, 0],
  })).result
  console.log('[12] line:', lineId)

  // Try to create a sketch region
  const sr = await api.v1.sketch.sketchRegion({ id: skId })
  console.log('[12] sketchRegion result:', sr.result, 'maxLevel:', sr.maxLevel)
  console.log('[12] sketchRegion messages:', JSON.stringify(sr.messages))

  filewrite({ arcId, lineId, regionResult: sr.result, regionMaxLevel: sr.maxLevel }, 'region-test')

  await snapshot('arc-region')
  return { partId }
}
