// Default auto-generated region names looked up via part.getSketchRegion
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const rect1 = (await api.v1.sketch.rectangle({
    id: skId, startPos: [0, 0, 0], endPos: [40, 30, 0],
  })).result
  const region1 = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rect1 })).result

  const rect2 = (await api.v1.sketch.rectangle({
    id: skId, startPos: [50, 0, 0], endPos: [90, 30, 0],
  })).result
  const region2 = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rect2 })).result

  console.log('[05] region1:', region1, 'region2:', region2)

  const r1 = await api.v1.part.getSketchRegion({ id: partId, name: 'SketchRegion' })
  const r2 = await api.v1.part.getSketchRegion({ id: partId, name: 'SketchRegion0' })
  const r3 = await api.v1.part.getSketchRegion({ id: partId, name: 'SketchRegion1' })

  console.log('[05] SketchRegion:', r1.result, 'SketchRegion0:', r2.result, 'SketchRegion1:', r3.result)

  filewrite({
    region1, region2,
    lookupSketchRegion: { result: r1.result, maxLevel: r1.maxLevel },
    lookupSketchRegion0: { result: r2.result, maxLevel: r2.maxLevel },
    lookupSketchRegion1: { result: r3.result, maxLevel: r3.maxLevel },
  }, 'default-names')

  return { partId }
}
