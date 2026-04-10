// Realistic workflow: box → sketch on face → project edges → draw geometry
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Workflow' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 100, width: 80, height: 30 })).result

  // Get top face and create sketch immediately (no snapshot between)
  const gf = await api.v1.part.getGeometryIds({
    id: partId,
    planes: [{ positions: [[50, 40, 30]] }]
  })
  const topFace = gf.result.planes[0]
  console.log('[15] topFace:', topFace)

  const skId = (await api.v1.sketch.create({ id: partId, name: 'TopSketch', planeId: topFace })).result
  console.log('[15] sketchId:', skId)

  // Re-fetch edges after sketch creation
  const geo = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [
      { pos: [50, 0, 30] },   // top-front edge
      { pos: [100, 40, 30] }, // top-right edge
    ]
  })
  const frontEdge = geo.result.lines[0]
  const rightEdge = geo.result.lines[1]
  console.log('[15] frontEdge:', frontEdge, 'rightEdge:', rightEdge)

  // Project edges into sketch
  const refResult = await api.v1.sketch.referenceGeometry({
    id: skId,
    brepIds: [frontEdge, rightEdge]
  })
  console.log('[15] refGeo result:', refResult.result, 'maxLevel:', refResult.maxLevel)

  if (refResult.result) {
    for (const rid of refResult.result) {
      const pos = await api.v1.sketch.getPositions({ id: rid })
      console.log(`[15] ref ${rid}:`, JSON.stringify(pos.result))
    }
  }

  // Draw a rectangle near the projected edges
  const rect = await api.v1.sketch.rectangle({
    id: skId,
    startPos: [60, 10, 30],
    endPos: [90, 40, 30]
  })
  console.log('[15] rectangle:', rect.result, 'maxLevel:', rect.maxLevel)

  const skGeo = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[15] final sketch geometry:', JSON.stringify(skGeo.result))
  filewrite(skGeo.result, 'sketch-geometry')

  await snapshot('workflow-result')
  return { partId }
}
