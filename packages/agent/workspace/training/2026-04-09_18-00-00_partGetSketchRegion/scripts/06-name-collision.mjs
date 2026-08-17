// Name collision: region named "Right" (collides with work plane), lookup via part
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0],
  })).result

  // "Right" collides with default work plane — should be stored as "Right0"
  const regionId = (await api.v1.sketch.sketchRegion({
    id: skId, geomIds: rectIds, name: 'Right',
  })).result

  console.log('[06] created region:', regionId)

  // Try lookup by intended name "Right"
  const byIntended = await api.v1.part.getSketchRegion({ id: partId, name: 'Right' })
  console.log('[06] lookup "Right":', byIntended.result, 'maxLevel:', byIntended.maxLevel)

  // Try lookup by actual stored name "Right0"
  const byActual = await api.v1.part.getSketchRegion({ id: partId, name: 'Right0' })
  console.log('[06] lookup "Right0":', byActual.result, 'maxLevel:', byActual.maxLevel)

  filewrite({
    regionId,
    byIntendedName: { result: byIntended.result, maxLevel: byIntended.maxLevel, messages: byIntended.messages },
    byActualName: { result: byActual.result, maxLevel: byActual.maxLevel, messages: byActual.messages },
  }, 'name-collision')

  return { partId }
}
