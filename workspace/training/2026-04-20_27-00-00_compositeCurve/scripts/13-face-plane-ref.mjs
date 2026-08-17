export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FacePlaneTest' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 60, width: 40, height: 30 })).result

  // Get a face ID (top face at z=30)
  const geoFaces = (await api.v1.part.getGeometryIds({ id: partId, planes: [{ pos: [30, 20, 30] }] })).result
  console.log('[13] face IDs:', JSON.stringify(geoFaces))

  if (geoFaces.planes && geoFaces.planes.length > 0) {
    const faceId = geoFaces.planes[0]
    console.log('[13] using face:', faceId)

    const r = await api.v1.part.compositeCurve({ id: partId, name: 'CC_Face', references: [faceId] })
    console.log('[13] face ref result:', r.result)
    console.log('[13] maxLevel:', r.maxLevel)
    if (r.messages && r.messages.length > 0) {
      console.log('[13] messages:', JSON.stringify(r.messages))
    }

    filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel, faceId }, 'cc-face-response')
    await snapshot('face-ref')
  } else {
    console.log('[13] no planes found, trying getGeometryIds differently')
    filewrite(geoFaces, 'geo-faces')
  }

  return { partId }
}
