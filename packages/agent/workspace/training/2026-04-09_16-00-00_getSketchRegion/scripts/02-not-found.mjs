// Test getSketchRegion with a name that doesn't exist
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a rectangle + region
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0]
  })).result
  await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds, name: 'Exists' })

  // Look up a name that does NOT exist
  const r = await api.v1.sketch.getSketchRegion({ id: skId, name: 'DoesNotExist' })
  console.log('[02] not-found result:', r.result)
  console.log('[02] maxLevel:', r.maxLevel)
  console.log('[02] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'not-found')

  return { partId }
}
