export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FacePlaneTest2' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 60, width: 40, height: 30 })).result

  // Get top face using correct `positions` param (plural, array of points)
  const geoFaces = (await api.v1.part.getGeometryIds({
    id: partId,
    planes: [{ positions: [[30, 20, 30]] }]
  })).result

  console.log('[14] face result:', JSON.stringify(geoFaces))

  if (geoFaces && geoFaces.planes && geoFaces.planes.length > 0) {
    const faceId = geoFaces.planes[0]
    console.log('[14] using face:', faceId)

    // Also get an edge for mixed references
    const geoEdges = (await api.v1.part.getGeometryIds({
      id: partId,
      lines: [{ pos: [30, 0, 30] }]
    })).result
    const edgeId = geoEdges.lines[0]
    console.log('[14] edge:', edgeId)

    // Composite curve from face-plane only
    const r1 = await api.v1.part.compositeCurve({ id: partId, name: 'CC_Face', references: [faceId] })
    console.log('[14] face-only CC result:', r1.result, 'maxLevel:', r1.maxLevel)
    if (r1.messages && r1.messages.length > 0) {
      console.log('[14] face-only messages:', JSON.stringify(r1.messages))
    }

    // Mixed: edge + face
    const r2 = await api.v1.part.compositeCurve({ id: partId, name: 'CC_Mixed', references: [edgeId, faceId] })
    console.log('[14] mixed CC result:', r2.result, 'maxLevel:', r2.maxLevel)
    if (r2.messages && r2.messages.length > 0) {
      console.log('[14] mixed messages:', JSON.stringify(r2.messages))
    }

    filewrite({
      faceOnly: { result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel },
      mixed: { result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }
    }, 'face-responses')

    await snapshot('face-plane-ref')
  } else {
    console.log('[14] no face found')
    filewrite(geoFaces, 'geo-result')
  }

  return { partId }
}
