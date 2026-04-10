// Not-found case: lookup a nonexistent region name from a part
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0],
  })).result
  await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds, name: 'Exists' })

  // Lookup nonexistent name
  const r = await api.v1.part.getSketchRegion({ id: partId, name: 'DoesNotExist' })
  console.log('[02] not-found result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[02] messages:', JSON.stringify(r.messages))

  filewrite({
    result: r.result,
    maxLevel: r.maxLevel,
    messages: r.messages,
  }, 'not-found')

  return { partId }
}
