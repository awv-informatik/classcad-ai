// Test: Confirm update replaces, not merges — update with subset of original
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a rectangle (4 lines)
  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result
  console.log('[07] rectIds:', rectIds)

  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  // Verify 4 lines
  const geomBefore = await api.v1.sketch.getGeometry({ id: regionId })
  console.log('[07] lines before:', geomBefore.result.lines.length)

  // Update to just 2 of the 4 lines (subset)
  const twoLines = [rectIds[0], rectIds[1]]
  const r = await api.v1.sketch.updateSketchRegion({ regions: [{ id: regionId, geomIds: twoLines }] })
  console.log('[07] update result:', r.result, 'maxLevel:', r.maxLevel)

  const geomAfter = await api.v1.sketch.getGeometry({ id: regionId })
  console.log('[07] lines after:', geomAfter.result.lines.length, 'ids:', geomAfter.result.lines)
  filewrite({ before: geomBefore.result, after: geomAfter.result }, 'replace-proof')

  return { partId }
}
