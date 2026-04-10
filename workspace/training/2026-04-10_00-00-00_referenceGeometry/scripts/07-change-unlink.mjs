// Test changeReferenceGeometry and unlinkReferenceGeometry
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ChangeUnlink' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result

  // Get top face + two bottom edges
  const geo = await api.v1.part.getGeometryIds({
    id: partId,
    planes: [{ positions: [[40, 30, 40]] }],
    lines: [
      { pos: [40, 0, 0] },   // bottom-front edge
      { pos: [40, 60, 0] },  // bottom-back edge
    ]
  })
  const topFaceId = geo.result.planes[0]
  const frontEdge = geo.result.lines[0]
  const backEdge = geo.result.lines[1]
  console.log('[07] topFace:', topFaceId, 'frontEdge:', frontEdge, 'backEdge:', backEdge)

  // Create sketch, project front edge
  const skId = (await api.v1.sketch.create({ id: partId, name: 'ChangeSketch', planeId: topFaceId })).result
  const r1 = await api.v1.sketch.referenceGeometry({ id: skId, brepIds: [frontEdge] })
  const projectedLineId = r1.result[0]
  console.log('[07] projected line from front edge:', projectedLineId)

  // Get position before change
  const posBefore = await api.v1.sketch.getPositions({ id: projectedLineId })
  console.log('[07] position before change:', JSON.stringify(posBefore.result))

  // changeReferenceGeometry — relink the projected line to the back edge
  const cr = await api.v1.sketch.changeReferenceGeometry({
    id: skId,
    geomId: projectedLineId,
    refId: backEdge
  })
  console.log('[07] changeReferenceGeometry — result:', cr.result, 'maxLevel:', cr.maxLevel)
  console.log('[07] changeRef messages:', JSON.stringify(cr.messages))
  filewrite({ result: cr.result, messages: cr.messages, maxLevel: cr.maxLevel }, 'change-ref')

  // Get position after change — should now match back edge
  const posAfter = await api.v1.sketch.getPositions({ id: projectedLineId })
  console.log('[07] position after change:', JSON.stringify(posAfter.result))
  filewrite({ before: posBefore.result, after: posAfter.result }, 'positions-change')

  // unlinkReferenceGeometry — disconnect the link
  const ur = await api.v1.sketch.unlinkReferenceGeometry({
    id: skId,
    geomId: projectedLineId
  })
  console.log('[07] unlinkReferenceGeometry — result:', ur.result, 'maxLevel:', ur.maxLevel)
  console.log('[07] unlink messages:', JSON.stringify(ur.messages))
  filewrite({ result: ur.result, messages: ur.messages, maxLevel: ur.maxLevel }, 'unlink-ref')

  // Geometry should still exist in sketch after unlink
  const geoAfter = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[07] sketch geometry after unlink:', JSON.stringify(geoAfter.result))
  filewrite(geoAfter.result, 'sketch-geometry-after-unlink')

  // Position should remain at back edge position (frozen)
  const posUnlinked = await api.v1.sketch.getPositions({ id: projectedLineId })
  console.log('[07] position after unlink:', JSON.stringify(posUnlinked.result))

  await snapshot('change-unlink')
  return { partId }
}
