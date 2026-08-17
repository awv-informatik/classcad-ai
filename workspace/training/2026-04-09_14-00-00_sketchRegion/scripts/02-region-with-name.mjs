// Create a sketch region with an explicit name
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NamedRegion' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const rect = await api.v1.sketch.rectangle({
    id: skId,
    startPos: [0, 0, 0],
    endPos: [60, 40, 0],
  })

  // Create region with explicit name
  const region = await api.v1.sketch.sketchRegion({
    id: skId,
    geomIds: rect.result,
    name: 'MyCustomRegion',
  })
  console.log('[02] named region result:', region.result, 'maxLevel:', region.maxLevel)

  // Try to retrieve it by name using sketch.getSketchRegion
  const found = await api.v1.sketch.getSketchRegion({
    id: skId,
    name: 'MyCustomRegion',
  })
  console.log('[02] getSketchRegion result:', found.result, 'maxLevel:', found.maxLevel)
  console.log('[02] IDs match:', region.result === found.result)

  filewrite({ regionId: region.result, foundId: found.result, match: region.result === found.result }, 'named-region')

  return { partId, regionId: region.result }
}
