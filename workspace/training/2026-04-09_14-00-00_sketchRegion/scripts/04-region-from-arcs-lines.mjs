// Create a sketch region from mixed geometry: 2 lines + 2 arcs forming a closed loop
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MixedRegion' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Build a rounded rectangle shape manually:
  // Bottom line
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [10, 0, 0], endPos: [50, 0, 0] })).result
  // Right arc (quarter circle connecting bottom-right to top-right)
  const a1 = (await api.v1.sketch.arcBy3Points({ id: skId, startPos: [50, 0, 0], midPos: [60, 15, 0], endPos: [50, 30, 0] })).result
  // Top line
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [50, 30, 0], endPos: [10, 30, 0] })).result
  // Left arc (quarter circle connecting top-left to bottom-left)
  const a2 = (await api.v1.sketch.arcBy3Points({ id: skId, startPos: [10, 30, 0], midPos: [0, 15, 0], endPos: [10, 0, 0] })).result

  console.log('[04] geometry IDs - l1:', l1, 'a1:', a1, 'l2:', l2, 'a2:', a2)

  const region = await api.v1.sketch.sketchRegion({
    id: skId,
    geomIds: [l1, a1, l2, a2],
  })
  console.log('[04] mixed region result:', region.result, 'maxLevel:', region.maxLevel)
  console.log('[04] messages:', JSON.stringify(region.messages))

  filewrite({ result: region.result, messages: region.messages, maxLevel: region.maxLevel }, 'mixed-region')

  await snapshot('mixed-region')
  return { partId, regionId: region.result }
}
