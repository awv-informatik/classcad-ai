// Create a sketch region from a rectangle (4 lines forming a closed loop)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RegionTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a rectangle — returns 4 line IDs
  const rect = await api.v1.sketch.rectangle({
    id: skId,
    startPos: [0, 0, 0],
    endPos: [80, 50, 0],
  })
  console.log('[01] rectangle result:', rect.result, 'maxLevel:', rect.maxLevel)

  // Create a sketch region from the rectangle lines
  const region = await api.v1.sketch.sketchRegion({
    id: skId,
    geomIds: rect.result,
  })
  console.log('[01] sketchRegion result:', region.result, 'maxLevel:', region.maxLevel)
  console.log('[01] messages:', JSON.stringify(region.messages))

  filewrite({ result: region.result, messages: region.messages, maxLevel: region.maxLevel }, 'region-response')

  await snapshot('region-from-rect')
  return { partId, skId, regionId: region.result, rectIds: rect.result }
}
