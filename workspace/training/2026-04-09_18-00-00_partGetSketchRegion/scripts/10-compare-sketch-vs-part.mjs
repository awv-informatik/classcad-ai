// Compare: sketch.getSketchRegion vs part.getSketchRegion return values
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0],
  })).result
  const regionId = (await api.v1.sketch.sketchRegion({
    id: skId, geomIds: rectIds, name: 'CompareRegion',
  })).result

  const rSketch = await api.v1.sketch.getSketchRegion({ id: skId, name: 'CompareRegion' })
  const rPart = await api.v1.part.getSketchRegion({ id: partId, name: 'CompareRegion' })

  console.log('[10] sketch version:', rSketch.result, 'maxLevel:', rSketch.maxLevel)
  console.log('[10] part version:', rPart.result, 'maxLevel:', rPart.maxLevel)
  console.log('[10] same result:', rSketch.result === rPart.result)

  filewrite({
    regionId,
    sketchVersion: { result: rSketch.result, maxLevel: rSketch.maxLevel, messages: rSketch.messages },
    partVersion: { result: rPart.result, maxLevel: rPart.maxLevel, messages: rPart.messages },
    sameResult: rSketch.result === rPart.result,
  }, 'compare')

  return { partId }
}
