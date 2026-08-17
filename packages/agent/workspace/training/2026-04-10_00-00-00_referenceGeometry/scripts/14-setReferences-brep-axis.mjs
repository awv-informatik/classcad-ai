// Test setReferences with brep edge as axisId, and brep vertex as originId
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SetRefBRep' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result

  // Get brep elements for axis and origin references
  const geo = await api.v1.part.getGeometryIds({
    id: partId,
    planes: [{ positions: [[40, 30, 40]] }],  // top face
    lines: [
      { pos: [40, 0, 40] },   // top-front edge (direction: +X)
      { pos: [0, 30, 40] },   // top-left edge (direction: +Y)
    ],
    points: [
      { pos: [0, 0, 40] },    // top-front-left vertex
      { pos: [80, 60, 40] },  // top-back-right vertex
    ]
  })
  const topFace = geo.result.planes[0]
  const frontEdge = geo.result.lines[0]
  const leftEdge = geo.result.lines[1]
  const vertex1 = geo.result.points[0]
  const vertex2 = geo.result.points[1]
  console.log('[14] topFace:', topFace, 'frontEdge:', frontEdge, 'leftEdge:', leftEdge)
  console.log('[14] vertex1:', vertex1, 'vertex2:', vertex2)

  // Create sketch on top face
  const skId = (await api.v1.sketch.create({ id: partId, name: 'BRepRefSketch', planeId: topFace })).result

  // Draw a reference line so we can track coordinate system changes
  const refLineStartGeo = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [40, 0, 0] }]
  })
  const bottomEdge = refLineStartGeo.result.lines[0]
  const rg = await api.v1.sketch.referenceGeometry({ id: skId, brepIds: [bottomEdge] })
  const trackerLine = rg.result[0]
  console.log('[14] tracker line ID:', trackerLine)

  // Baseline position
  const pos0 = await api.v1.sketch.getPositions({ id: trackerLine })
  console.log('[14] baseline position:', JSON.stringify(pos0.result))

  // setReferences with brep edge as axisId
  const sr1 = await api.v1.sketch.setReferences({ id: skId, planeId: topFace, axisId: frontEdge })
  console.log('[14] setRef with brep edge axis — maxLevel:', sr1.maxLevel, 'messages:', JSON.stringify(sr1.messages))
  const pos1 = await api.v1.sketch.getPositions({ id: trackerLine })
  console.log('[14] after brep edge axis:', JSON.stringify(pos1.result))

  // setReferences with brep vertex as originId
  const sr2 = await api.v1.sketch.setReferences({ id: skId, planeId: topFace, originId: vertex2 })
  console.log('[14] setRef with brep vertex origin — maxLevel:', sr2.maxLevel, 'messages:', JSON.stringify(sr2.messages))
  const pos2 = await api.v1.sketch.getPositions({ id: trackerLine })
  console.log('[14] after brep vertex origin:', JSON.stringify(pos2.result))

  // setReferences with invertAxis: TRUE
  const sr3 = await api.v1.sketch.setReferences({ id: skId, planeId: topFace, axisId: frontEdge, invertAxis: 1 })
  console.log('[14] setRef with invertAxis — maxLevel:', sr3.maxLevel, 'messages:', JSON.stringify(sr3.messages))
  const pos3 = await api.v1.sketch.getPositions({ id: trackerLine })
  console.log('[14] after invertAxis:', JSON.stringify(pos3.result))

  filewrite({
    baseline: pos0.result,
    afterBrepEdgeAxis: pos1.result,
    afterBrepVertexOrigin: pos2.result,
    afterInvertAxis: pos3.result
  }, 'positions')

  return { partId }
}
