export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const cylId = (await api.v1.part.cylinder({ id: partId, radius: 20, height: 50 })).result
  await api.v1.common.recalc({})

  // Get circular edges (avoid seam at +X)
  const circleResult = await api.v1.part.getGeometryIds({
    id: partId,
    circles: [
      { pos: [-20, 0, 0] },   // bottom circle (opposite seam)
      { pos: [-20, 0, 50] },  // top circle (opposite seam)
    ],
  })
  console.log('[04] circle IDs:', circleResult.result.circles, 'maxLevel:', circleResult.maxLevel)

  // Get cylindrical face (avoid seam positions)
  const cylFaceResult = await api.v1.part.getGeometryIds({
    id: partId,
    cylinders: [
      { positions: [[-20, 0, 25], [0, 20, 25]] },
    ],
  })
  console.log('[04] cylinder face IDs:', cylFaceResult.result.cylinders, 'maxLevel:', cylFaceResult.maxLevel)

  // Collect all valid IDs
  const circleIds = circleResult.result.circles || []
  const cylFaceIds = (cylFaceResult.result.cylinders || []).flat().filter(id => id)
  const allIds = [...circleIds, ...cylFaceIds]
  console.log('[04] all IDs to query:', allIds)

  // Get positions
  const r = await api.v1.part.getGeometryPositions({ elems: allIds })
  console.log('[04] getGeometryPositions maxLevel:', r.maxLevel)

  for (const item of r.result) {
    console.log('[04] id:', item.id, 'positions count:', item.positions.length)
    console.log('[04] positions:', JSON.stringify(item.positions))
  }

  filewrite({
    circleIds,
    cylFaceIds,
    geoPositionsResult: r.result,
    maxLevel: r.maxLevel,
  }, 'cylinder-circles')

  await snapshot('cylinder')
  return { partId }
}
