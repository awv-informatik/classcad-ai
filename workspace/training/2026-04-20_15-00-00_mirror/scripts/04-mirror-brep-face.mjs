export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MirrorFace' })).result

  const boxId = (await api.v1.part.box({
    id: partId,
    name: 'Box1',
    length: 60,
    width: 40,
    height: 30,
  })).result

  await api.v1.common.recalc({})

  // Get a brep face to use as mirror reference
  // Try the right face (x=60, at center y=20, z=15)
  const geoIds = (await api.v1.part.getGeometryIds({
    id: partId,
    planes: [{ positions: [[60, 20, 15]] }],
  })).result
  console.log('[04] brep face IDs:', JSON.stringify(geoIds))

  const faceId = geoIds.planes[0]
  console.log('[04] faceId:', faceId)

  await snapshot('before-face-mirror')

  // Mirror using a brep face as reference
  const r = await api.v1.part.mirror({
    id: partId,
    targets: [boxId],
    references: [faceId],
  })
  console.log('[04] mirrorId:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages) console.log('[04] messages:', JSON.stringify(r.messages))

  await snapshot('after-face-mirror')

  return { partId, boxId, mirrorId: r.result }
}
