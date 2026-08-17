// Same region name in two different sketches — which one does part.getSketchRegion return?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result

  // Sketch 1 with region "Profile"
  const sk1 = (await api.v1.sketch.create({ id: partId })).result
  const rect1 = (await api.v1.sketch.rectangle({
    id: sk1, startPos: [0, 0, 0], endPos: [40, 30, 0],
  })).result
  const region1 = (await api.v1.sketch.sketchRegion({
    id: sk1, geomIds: rect1, name: 'Profile',
  })).result

  // Sketch 2 with region also named "Profile"
  const sk2 = (await api.v1.sketch.create({ id: partId })).result
  const rect2 = (await api.v1.sketch.rectangle({
    id: sk2, startPos: [0, 0, 0], endPos: [60, 40, 0],
  })).result
  const region2 = (await api.v1.sketch.sketchRegion({
    id: sk2, geomIds: rect2, name: 'Profile',
  })).result

  console.log('[11] region1:', region1, 'region2:', region2)

  // Which one does part.getSketchRegion find?
  const r = await api.v1.part.getSketchRegion({ id: partId, name: 'Profile' })
  console.log('[11] part lookup "Profile":', r.result, 'maxLevel:', r.maxLevel)
  console.log('[11] matched region1:', r.result === region1, 'matched region2:', r.result === region2)

  filewrite({
    region1, region2,
    lookupResult: r.result,
    maxLevel: r.maxLevel,
    matchedRegion1: r.result === region1,
    matchedRegion2: r.result === region2,
  }, 'same-name-diff-sketches')

  return { partId }
}
