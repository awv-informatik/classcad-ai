// Test keepReference: FALSE — should still project geometry but without associative link
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'KeepRefTest' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result

  const geoFace = await api.v1.part.getGeometryIds({
    id: partId,
    planes: [{ positions: [[40, 30, 40]] }]
  })
  const topFaceId = geoFace.result.planes[0]

  const geo = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [40, 0, 0] }]
  })
  const edgeId = geo.result.lines[0]

  // Create sketch on top face
  const skId = (await api.v1.sketch.create({ id: partId, name: 'KeepRefSketch', planeId: topFaceId })).result

  // Test keepReference: FALSE (note: ClassCAD uses FALSE constant, which is 0)
  const r = await api.v1.sketch.referenceGeometry({
    id: skId,
    brepIds: [edgeId],
    keepReference: 0  // FALSE
  })
  console.log('[06] refGeo keepReference:FALSE — result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[06] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'refgeo-no-keep')

  // Check sketch geometry
  const geo2 = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[06] sketch geometry:', JSON.stringify(geo2.result))
  filewrite(geo2.result, 'sketch-geometry')

  // Now try to update the box and see if the sketch reference geometry updates
  // First, with keepReference=TRUE on a second edge for comparison
  const geo3 = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [40, 60, 0] }]  // bottom-back edge
  })
  const edgeId2 = geo3.result.lines[0]

  const r2 = await api.v1.sketch.referenceGeometry({
    id: skId,
    brepIds: [edgeId2],
    keepReference: 1  // TRUE (explicit)
  })
  console.log('[06] refGeo keepReference:TRUE — result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'refgeo-keep-true')

  // Get sketch geometry positions to record their projected coordinates
  const geoAfter = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[06] sketch geometry after both:', JSON.stringify(geoAfter.result))
  filewrite(geoAfter.result, 'sketch-geometry-both')

  // Get positions of the projected lines
  for (const lineId of geoAfter.result.lines) {
    const pts = await api.v1.sketch.getPoints({ id: lineId })
    console.log(`[06] line ${lineId} points:`, JSON.stringify(pts.result))
    const positions = await api.v1.sketch.getPositions({ id: lineId })
    console.log(`[06] line ${lineId} positions:`, JSON.stringify(positions.result))
  }

  await snapshot('keepref-test')
  return { partId }
}
