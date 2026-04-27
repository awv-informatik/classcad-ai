export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})

  // Get face IDs — planes on the box
  const geoIds = await api.v1.part.getGeometryIds({
    id: partId,
    planes: [
      { positions: [[40, 0, 20]] },    // front face (Y=0)
      { positions: [[40, 30, 40]] },    // top face (Z=40)
      { positions: [[0, 30, 20]] },     // left face (X=0)
    ],
  })
  console.log('[03] getGeometryIds maxLevel:', geoIds.maxLevel)
  console.log('[03] plane IDs:', geoIds.result.planes)

  const planeIds = geoIds.result.planes

  // Get positions for these faces
  const r = await api.v1.part.getGeometryPositions({ elems: planeIds })
  console.log('[03] getGeometryPositions maxLevel:', r.maxLevel)

  for (const item of r.result) {
    console.log('[03] id:', item.id, 'positions count:', item.positions.length)
    console.log('[03] id:', item.id, 'positions:', JSON.stringify(item.positions))
  }

  filewrite({
    planeIds,
    geoPositionsResult: r.result,
    maxLevel: r.maxLevel,
  }, 'plane-faces')

  return { partId }
}
