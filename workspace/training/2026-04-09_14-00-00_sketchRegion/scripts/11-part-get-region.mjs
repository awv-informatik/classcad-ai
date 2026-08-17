// part.getSketchRegion — lookup region by name from part level
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'PartLookup' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const rect = await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [60, 40, 0] })

  const region = await api.v1.sketch.sketchRegion({
    id: skId,
    geomIds: rect.result,
    name: 'ProfileRegion',
  })
  console.log('[11] created region:', region.result)

  // Use part.getSketchRegion (takes part ID, not sketch ID)
  const fromPart = await api.v1.part.getSketchRegion({
    id: partId,
    name: 'ProfileRegion',
  })
  console.log('[11] part.getSketchRegion result:', fromPart.result, 'maxLevel:', fromPart.maxLevel)
  console.log('[11] IDs match:', fromPart.result === region.result)

  // Also try with the auto-generated name from sketch.getSketchRegion
  const fromSketch = await api.v1.sketch.getSketchRegion({
    id: skId,
    name: 'ProfileRegion',
  })
  console.log('[11] sketch.getSketchRegion result:', fromSketch.result)
  console.log('[11] all three match:', region.result === fromPart.result && region.result === fromSketch.result)

  filewrite({
    regionId: region.result,
    partLookupId: fromPart.result,
    sketchLookupId: fromSketch.result,
    allMatch: region.result === fromPart.result && region.result === fromSketch.result,
  }, 'part-lookup')

  return { partId }
}
