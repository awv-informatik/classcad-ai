// Debug: why does the 3rd region fail to look up? Dump structure to check actual names
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const rect1 = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [30, 20, 0] })).result
  const rect2 = (await api.v1.sketch.rectangle({ id: skId, startPos: [40, 0, 0], endPos: [70, 20, 0] })).result
  const rect3 = (await api.v1.sketch.rectangle({ id: skId, startPos: [80, 0, 0], endPos: [110, 20, 0] })).result

  const reg1 = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rect1, name: 'Left' })).result
  const reg2 = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rect2, name: 'Center' })).result
  const r3full = await api.v1.sketch.sketchRegion({ id: skId, geomIds: rect3, name: 'Right' })
  const reg3 = r3full.result
  console.log('[09] reg3 creation maxLevel:', r3full.maxLevel)
  console.log('[09] reg IDs:', reg1, reg2, reg3)

  // Look at structure to find actual names stored for each region
  // Use the structure tree from the last API call
  const structNodes = r3full.structure
  // Find CC_SketchRegion nodes
  const findRegions = (nodes) => {
    const regions = []
    const walk = (node) => {
      if (node.className === 'CC_SketchRegion') {
        regions.push({ id: node.id, name: node.name, className: node.className })
      }
      if (node.children) node.children.forEach(walk)
    }
    if (Array.isArray(nodes)) nodes.forEach(walk)
    else walk(nodes)
    return regions
  }

  const regions = findRegions(structNodes)
  console.log('[09] structure regions:', JSON.stringify(regions))

  // Try looking up each by its structure name
  for (const reg of regions) {
    const r = await api.v1.sketch.getSketchRegion({ id: skId, name: reg.name })
    console.log(`[09] lookup "${reg.name}" (id=${reg.id}):`, r.result, 'found:', r.result !== null)
  }

  filewrite({ regions, reg3Creation: { maxLevel: r3full.maxLevel, messages: r3full.messages } }, 'debug-names')

  return { partId }
}
