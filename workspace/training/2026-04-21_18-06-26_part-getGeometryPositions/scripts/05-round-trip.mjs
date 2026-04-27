export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})

  // Step 1: get edge IDs from known positions
  const geoIds = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [
      { pos: [0, 0, 20] },    // front-left vertical edge
      { pos: [40, 0, 0] },    // front-bottom horizontal edge
    ],
    points: [
      { pos: [0, 0, 0] },     // origin corner
    ],
    planes: [
      { positions: [[40, 0, 20]] },  // front face
    ],
  })
  const originalLineIds = geoIds.result.lines
  const originalPointIds = geoIds.result.points
  const originalPlaneIds = geoIds.result.planes
  console.log('[05] original line IDs:', originalLineIds)
  console.log('[05] original point IDs:', originalPointIds)
  console.log('[05] original plane IDs:', originalPlaneIds)

  // Step 2: get positions for those IDs
  const allIds = [...originalLineIds, ...originalPointIds, ...originalPlaneIds]
  const posResult = await api.v1.part.getGeometryPositions({ elems: allIds })
  console.log('[05] getGeometryPositions maxLevel:', posResult.maxLevel)

  for (const item of posResult.result) {
    console.log('[05] id:', item.id, 'positions:', JSON.stringify(item.positions))
  }

  // Step 3: use the returned positions to re-find the same IDs
  const linePos = posResult.result[0].positions[0] // midpoint of first line
  const pointPos = posResult.result[1].positions[0] // vertex position
  const facePosArr = posResult.result[2].positions // edge midpoints of face

  // Re-find the line using its midpoint
  const lineRequery = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [linePos.x, linePos.y, linePos.z] }],
  })
  console.log('[05] re-found line ID:', lineRequery.result.lines, 'original:', originalLineIds[0])
  console.log('[05] line round-trip match:', lineRequery.result.lines[0] === originalLineIds[0])

  // Re-find the vertex
  const pointRequery = await api.v1.part.getGeometryIds({
    id: partId,
    points: [{ pos: [pointPos.x, pointPos.y, pointPos.z] }],
  })
  console.log('[05] re-found point ID:', pointRequery.result.points, 'original:', originalPointIds[0])
  console.log('[05] point round-trip match:', pointRequery.result.points[0] === originalPointIds[0])

  // Re-find the face using its edge midpoints
  const facePositions = facePosArr.map(p => [p.x, p.y, p.z])
  const faceRequery = await api.v1.part.getGeometryIds({
    id: partId,
    planes: [{ positions: facePositions }],
  })
  console.log('[05] re-found plane ID:', faceRequery.result.planes, 'original:', originalPlaneIds[0])
  console.log('[05] plane round-trip match:', faceRequery.result.planes[0] === originalPlaneIds[0])

  filewrite({
    originalIds: { lines: originalLineIds, points: originalPointIds, planes: originalPlaneIds },
    positions: posResult.result,
    roundTrip: {
      line: { original: originalLineIds[0], refound: lineRequery.result.lines[0], match: lineRequery.result.lines[0] === originalLineIds[0] },
      point: { original: originalPointIds[0], refound: pointRequery.result.points[0], match: pointRequery.result.points[0] === originalPointIds[0] },
      plane: { original: originalPlaneIds[0], refound: faceRequery.result.planes[0], match: faceRequery.result.planes[0] === originalPlaneIds[0] },
    },
  }, 'round-trip')

  return { partId }
}
