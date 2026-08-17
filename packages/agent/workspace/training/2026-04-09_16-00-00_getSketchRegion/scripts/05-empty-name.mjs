// Test getSketchRegion with empty string and missing name param
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0]
  })).result
  await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds, name: 'Test' })

  // Empty string name
  const r1 = await api.v1.sketch.getSketchRegion({ id: skId, name: '' })
  console.log('[05] empty string name - result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[05] empty string messages:', JSON.stringify(r1.messages))

  filewrite({
    emptyName: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
  }, 'empty-name')

  return { partId }
}
