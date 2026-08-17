export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const sphereId = (await api.v1.part.sphere({ id: partId, diameter: 60 })).result
  await api.v1.common.recalc({})

  // Get sphere face
  const sphereGeo = await api.v1.part.getGeometryIds({
    id: partId,
    spheres: [{ positions: [[0, 0, 30], [0, 30, 0]] }],
  })
  console.log('[09] sphere face IDs:', sphereGeo.result.spheres, 'maxLevel:', sphereGeo.maxLevel)

  // Get circles on the sphere (equator, seam edges)
  const circleGeo = await api.v1.part.getGeometryIds({
    id: partId,
    circles: [{ pos: [0, 0, 0] }],  // equator
  })
  console.log('[09] circle IDs:', circleGeo.result.circles, 'maxLevel:', circleGeo.maxLevel)

  // Get vertex on sphere
  const vertexGeo = await api.v1.part.getGeometryIds({
    id: partId,
    points: [{ pos: [0, 0, 30] }],  // north pole
  })
  console.log('[09] vertex IDs:', vertexGeo.result.points, 'maxLevel:', vertexGeo.maxLevel)

  // Collect all valid IDs
  const allIds = []
  if (sphereGeo.result.spheres?.[0]) allIds.push(sphereGeo.result.spheres[0])
  if (circleGeo.result.circles?.[0]) allIds.push(circleGeo.result.circles[0])
  if (vertexGeo.result.points?.[0]) allIds.push(vertexGeo.result.points[0])
  console.log('[09] all IDs:', allIds)

  if (allIds.length > 0) {
    const r = await api.v1.part.getGeometryPositions({ elems: allIds })
    console.log('[09] maxLevel:', r.maxLevel)
    for (const item of r.result) {
      console.log('[09] id:', item.id, 'type:', typeof item.id, 'positions count:', item.positions.length)
      console.log('[09] positions:', JSON.stringify(item.positions))
    }
    filewrite({ allIds, result: r.result, maxLevel: r.maxLevel }, 'sphere-cone')
  } else {
    console.log('[09] no valid IDs found')
    filewrite({ sphereGeo: sphereGeo, circleGeo: circleGeo, vertexGeo: vertexGeo }, 'sphere-cone-failed')
  }

  await snapshot('sphere')
  return { partId }
}
