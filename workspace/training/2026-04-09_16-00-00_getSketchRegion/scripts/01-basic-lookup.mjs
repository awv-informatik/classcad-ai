// Test basic getSketchRegion — create a named region, then look it up
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a rectangle
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0]
  })).result

  // Create a named region
  const regionId = (await api.v1.sketch.sketchRegion({
    id: skId, geomIds: rectIds, name: 'MyRegion'
  })).result
  console.log('[01] created region:', regionId)

  // Look it up by name
  const r = await api.v1.sketch.getSketchRegion({ id: skId, name: 'MyRegion' })
  console.log('[01] getSketchRegion result:', r.result)
  console.log('[01] maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))
  console.log('[01] match:', r.result === regionId)

  filewrite({ regionId, lookupResult: r.result, match: r.result === regionId, maxLevel: r.maxLevel, messages: r.messages }, 'lookup-result')

  return { partId }
}
