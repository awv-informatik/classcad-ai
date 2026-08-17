export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})

  // Get vertex IDs
  const geoIds = await api.v1.part.getGeometryIds({
    id: partId,
    points: [
      { pos: [0, 0, 0] },      // origin corner
      { pos: [80, 60, 40] },    // far corner
      { pos: [80, 0, 0] },      // front-right-bottom
    ],
  })
  console.log('[02] getGeometryIds maxLevel:', geoIds.maxLevel)
  console.log('[02] point IDs:', geoIds.result.points)

  const pointIds = geoIds.result.points

  // Get positions for these vertices
  const r = await api.v1.part.getGeometryPositions({ elems: pointIds })
  console.log('[02] getGeometryPositions maxLevel:', r.maxLevel)

  for (const item of r.result) {
    console.log('[02] id:', item.id, 'positions:', JSON.stringify(item.positions))
  }

  filewrite({
    pointIds,
    geoPositionsResult: r.result,
    maxLevel: r.maxLevel,
  }, 'vertices')

  return { partId }
}
