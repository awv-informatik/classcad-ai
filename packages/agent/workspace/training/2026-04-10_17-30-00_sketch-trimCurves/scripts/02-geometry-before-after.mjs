// 02: Dump geometry before/after split and trim to understand what trimCurves actually does
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TrimGeom' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Draw two intersecting lines
  const line1 = (await api.v1.sketch.line({ id: skId, startPos: [-50, 0, 0], endPos: [50, 0, 0] })).result
  const line2 = (await api.v1.sketch.line({ id: skId, startPos: [0, -50, 0], endPos: [0, 50, 0] })).result

  // Get geometry before split
  const geomBefore = await api.v1.sketch.getGeometry({ id: skId })
  filewrite(geomBefore.result, 'geom-before-split')
  console.log('[02] geometry before split — curve count:', Array.isArray(geomBefore.result) ? geomBefore.result.length : 'N/A')

  // Split all curves
  const splitRes = await api.v1.sketch.splitAllCurves({ id: skId })
  console.log('[02] splitAllCurves result:', JSON.stringify(splitRes.result))

  // Get geometry after split
  const geomAfterSplit = await api.v1.sketch.getGeometry({ id: skId })
  filewrite(geomAfterSplit.result, 'geom-after-split')
  console.log('[02] geometry after split — curve count:', Array.isArray(geomAfterSplit.result) ? geomAfterSplit.result.length : 'N/A')

  // Log each curve's details
  if (Array.isArray(geomAfterSplit.result)) {
    for (const c of geomAfterSplit.result) {
      console.log('[02]   curve id:', c.id, 'type:', c.type, 'startPos:', JSON.stringify(c.startPos), 'endPos:', JSON.stringify(c.endPos))
    }
  }

  // Trim the first trimmable curve
  if (Array.isArray(splitRes.result) && splitRes.result.length > 0) {
    const trimId = splitRes.result[0]
    console.log('[02] trimming curve id:', trimId)

    const trimRes = await api.v1.sketch.trimCurves({ id: skId, curveIds: [trimId] })
    console.log('[02] trimCurves maxLevel:', trimRes.maxLevel)

    // Get geometry after trim
    const geomAfterTrim = await api.v1.sketch.getGeometry({ id: skId })
    filewrite(geomAfterTrim.result, 'geom-after-trim')
    console.log('[02] geometry after trim — curve count:', Array.isArray(geomAfterTrim.result) ? geomAfterTrim.result.length : 'N/A')

    if (Array.isArray(geomAfterTrim.result)) {
      for (const c of geomAfterTrim.result) {
        console.log('[02]   curve id:', c.id, 'type:', c.type, 'startPos:', JSON.stringify(c.startPos), 'endPos:', JSON.stringify(c.endPos))
      }
    }
  }

  await snapshot('final')
  return { partId }
}
