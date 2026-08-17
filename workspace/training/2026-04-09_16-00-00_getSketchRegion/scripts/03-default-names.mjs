// Test getSketchRegion with default auto-generated names
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create two rectangles
  const rect1 = (await api.v1.sketch.rectangle({
    id: skId, startPos: [0, 0, 0], endPos: [40, 30, 0]
  })).result
  const rect2 = (await api.v1.sketch.rectangle({
    id: skId, startPos: [50, 0, 0], endPos: [90, 30, 0]
  })).result

  // Create regions with DEFAULT names (no name param)
  const region1 = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rect1 })).result
  const region2 = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rect2 })).result
  console.log('[03] region1:', region1, 'region2:', region2)

  // Try looking up by default names
  // From sketchRegion.md: first is "SketchRegion", second is "SketchRegion0"
  const r1 = await api.v1.sketch.getSketchRegion({ id: skId, name: 'SketchRegion' })
  console.log('[03] lookup SketchRegion:', r1.result, 'match:', r1.result === region1)

  const r2 = await api.v1.sketch.getSketchRegion({ id: skId, name: 'SketchRegion0' })
  console.log('[03] lookup SketchRegion0:', r2.result, 'match:', r2.result === region2)

  // Also try "SketchRegion1" — should NOT exist
  const r3 = await api.v1.sketch.getSketchRegion({ id: skId, name: 'SketchRegion1' })
  console.log('[03] lookup SketchRegion1 (should fail):', r3.result, 'maxLevel:', r3.maxLevel)

  filewrite({
    region1, region2,
    lookupSketchRegion: { result: r1.result, match: r1.result === region1 },
    lookupSketchRegion0: { result: r2.result, match: r2.result === region2 },
    lookupSketchRegion1: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
  }, 'default-names')

  return { partId }
}
