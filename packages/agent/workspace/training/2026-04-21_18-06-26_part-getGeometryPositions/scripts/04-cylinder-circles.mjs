export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const cylId = (await api.v1.part.cylinder({ id: partId, radius: 20, height: 50 })).result
  await api.v1.common.recalc({})

  // Get circular edges and cylindrical face
  const geoIds = await api.v1.part.getGeometryIds({
    id: partId,
    circles: [
      { pos: [0, 0, 0] },    // bottom circle (center)
      { pos: [0, 0, 50] },   // top circle (center)
    ],
    cylinders: [
      { positions: [[20, 0, 25], [0, 20, 25]] },  // cylindrical face
    ],
  })
  console.log('[04] getGeometryIds maxLevel:', geoIds.maxLevel)
  console.log('[04] circle IDs:', geoIds.result.circles)
  console.log('[04] cylinder IDs:', geoIds.result.cylinders)

  const allIds = [...(geoIds.result.circles || []), ...(geoIds.result.cylinders || [])]
  console.log('[04] all IDs to query:', allIds)

  // Get positions for circles and cylindrical face
  const r = await api.v1.part.getGeometryPositions({ elems: allIds })
  console.log('[04] getGeometryPositions maxLevel:', r.maxLevel)

  for (const item of r.result) {
    console.log('[04] id:', item.id, 'positions count:', item.positions.length)
    console.log('[04] positions:', JSON.stringify(item.positions))
  }

  filewrite({
    circleIds: geoIds.result.circles,
    cylinderIds: geoIds.result.cylinders,
    geoPositionsResult: r.result,
    maxLevel: r.maxLevel,
  }, 'cylinder-circles')

  await snapshot('cylinder')
  return { partId }
}
