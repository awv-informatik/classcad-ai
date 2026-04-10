// Empty string name and missing name parameter
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0],
  })).result
  await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds, name: 'Test' })

  // Empty string
  const rEmpty = await api.v1.part.getSketchRegion({ id: partId, name: '' })
  console.log('[08] empty name:', rEmpty.result, 'maxLevel:', rEmpty.maxLevel)

  filewrite({
    emptyName: { result: rEmpty.result, maxLevel: rEmpty.maxLevel, messages: rEmpty.messages },
  }, 'empty-name')

  return { partId }
}
