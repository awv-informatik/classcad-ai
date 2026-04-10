// Basic lookup: create a part, sketch, region, then look it up via part.getSketchRegion
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0],
  })).result

  const regionId = (await api.v1.sketch.sketchRegion({
    id: skId, geomIds: rectIds, name: 'MyRegion',
  })).result

  console.log('[01] created region:', regionId)

  // Look it up via part.getSketchRegion (part ID, not sketch ID)
  const r = await api.v1.part.getSketchRegion({ id: partId, name: 'MyRegion' })
  console.log('[01] part.getSketchRegion result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[01] match:', r.result === regionId)

  filewrite({
    createdRegionId: regionId,
    lookupResult: r.result,
    maxLevel: r.maxLevel,
    messages: r.messages,
    match: r.result === regionId,
  }, 'basic-lookup')

  return { partId }
}
