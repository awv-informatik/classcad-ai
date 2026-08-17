// Test recalc with sketch geometry — verify sketch IDs survive
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SketchRecalc' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  console.log('[12] skId:', skId)

  // Create a rectangle
  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [60, 40, 0] })).result
  console.log('[12] rectIds:', rectIds)

  // Read geometry before recalc
  const geoBefore = (await api.v1.sketch.getGeometry({ id: skId })).result
  console.log('[12] geometry before recalc:', JSON.stringify(geoBefore))

  // Recalc
  const r = await api.v1.common.recalc()
  console.log('[12] recalc result:', r.result, 'maxLevel:', r.maxLevel)

  // Read geometry after recalc — should be identical
  const geoAfter = (await api.v1.sketch.getGeometry({ id: skId })).result
  console.log('[12] geometry after recalc:', JSON.stringify(geoAfter))

  // Check if sketch curve IDs still work after recalc
  const pts = await api.v1.sketch.getPoints({ id: rectIds[0] })
  console.log('[12] getPoints after recalc: maxLevel=', pts.maxLevel, 'result:', JSON.stringify(pts.result))

  filewrite({
    geoBefore,
    geoAfter,
    geoMatch: JSON.stringify(geoBefore) === JSON.stringify(geoAfter),
    getPointsAfterRecalc: { maxLevel: pts.maxLevel, result: pts.result },
    recalc: { result: r.result, maxLevel: r.maxLevel }
  }, 'sketch-recalc')

  return { geoMatch: JSON.stringify(geoBefore) === JSON.stringify(geoAfter) }
}
