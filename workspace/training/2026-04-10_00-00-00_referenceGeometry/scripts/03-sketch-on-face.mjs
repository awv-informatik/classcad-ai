// Test referenceGeometry — create sketch on box face, then project edges from a different feature
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RefGeoTest3' })).result

  // Create a box
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  console.log('[03] boxId:', boxId)

  // Get the top face of the box
  const geoIds = await api.v1.part.getGeometryIds({
    id: partId,
    planes: [{ positions: [[40, 30, 40]] }],  // top face center
    lines: [
      { pos: [40, 0, 40] },   // top-front edge
      { pos: [0, 30, 40] },   // top-left edge
    ],
    points: [
      { pos: [0, 0, 40] },    // top-front-left vertex
    ]
  })
  console.log('[03] brep IDs:', JSON.stringify(geoIds.result))
  filewrite(geoIds.result, 'brep-ids')

  const topFaceId = geoIds.result.planes[0]
  const edgeId1 = geoIds.result.lines[0]
  const edgeId2 = geoIds.result.lines[1]
  const vertexId = geoIds.result.points[0]
  console.log('[03] topFaceId:', topFaceId, 'edgeId1:', edgeId1, 'edgeId2:', edgeId2, 'vertexId:', vertexId)

  // Create sketch on the top face
  const skId = (await api.v1.sketch.create({ id: partId, name: 'TopSketch', planeId: topFaceId })).result
  console.log('[03] sketchId:', skId)

  // Now get brep IDs again — they may have changed after sketch creation
  const geoIds2 = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [
      { pos: [40, 0, 0] },    // bottom-front edge (z=0)
      { pos: [40, 60, 40] },  // top-back edge
    ]
  })
  console.log('[03] post-sketch brep IDs:', JSON.stringify(geoIds2.result))
  const bottomEdge = geoIds2.result.lines[0]
  const topBackEdge = geoIds2.result.lines[1]
  console.log('[03] bottomEdge:', bottomEdge, 'topBackEdge:', topBackEdge)

  // Try referenceGeometry — project the bottom edge into the top-face sketch
  const r1 = await api.v1.sketch.referenceGeometry({
    id: skId,
    brepIds: [bottomEdge]
  })
  console.log('[03] refGeo (bottom edge) result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[03] refGeo messages:', JSON.stringify(r1.messages))
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'refgeo-bottom-edge')

  // Try with openFeature
  await api.v1.part.openFeature({ id: skId })
  const r2 = await api.v1.sketch.referenceGeometry({
    id: skId,
    brepIds: [bottomEdge]
  })
  console.log('[03] refGeo with open (bottom edge) result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[03] refGeo with open messages:', JSON.stringify(r2.messages))
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'refgeo-open-bottom')
  await api.v1.part.closeFeature({ id: skId })

  // Check sketch geometry
  const geo = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[03] sketch geometry:', JSON.stringify(geo.result))
  filewrite(geo.result, 'sketch-geometry')

  await snapshot('after')
  return { partId }
}
