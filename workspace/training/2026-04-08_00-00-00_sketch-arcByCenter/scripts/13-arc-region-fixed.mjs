// 13 — Arc + line closed profile with proper sketchRegion call (geomIds)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RegionFixed' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Half circle arc
  const arcId = (await api.v1.sketch.arcByCenter({
    id: skId,
    startPos: [-40, 0, 0],
    centerPos: [0, 0, 0],
    endPos: [40, 0, 0],
  })).result

  // Closing line
  const lineId = (await api.v1.sketch.line({
    id: skId,
    startPos: [40, 0, 0],
    endPos: [-40, 0, 0],
  })).result

  console.log('[13] arcId:', arcId, 'lineId:', lineId)

  // Create region with geomIds
  const sr = await api.v1.sketch.sketchRegion({ id: skId, geomIds: [arcId, lineId] })
  console.log('[13] sketchRegion:', sr.result, 'maxLevel:', sr.maxLevel, 'msgs:', JSON.stringify(sr.messages))

  filewrite({ arcId, lineId, regionResult: sr.result, regionMaxLevel: sr.maxLevel, messages: sr.messages }, 'region-fixed')

  await snapshot('arc-region-closed')
  return { partId }
}
