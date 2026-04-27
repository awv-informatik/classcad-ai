export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})

  // Get various element types
  const geoIds = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [0, 0, 20] }],
    points: [{ pos: [0, 0, 0] }],
    planes: [{ positions: [[40, 0, 20]] }],
  })
  const lineId = geoIds.result.lines[0]
  const pointId = geoIds.result.points[0]
  const planeId = geoIds.result.planes[0]
  console.log('[14] original IDs — line:', lineId, 'point:', pointId, 'plane:', planeId)

  // Get positions — query each separately to avoid indexing issues
  const linePos = (await api.v1.part.getGeometryPositions({ elems: [lineId] })).result
  const pointPos = (await api.v1.part.getGeometryPositions({ elems: [pointId] })).result
  const planePos = (await api.v1.part.getGeometryPositions({ elems: [planeId] })).result

  console.log('[14] line positions:', JSON.stringify(linePos[0].positions))
  console.log('[14] point positions:', JSON.stringify(pointPos[0].positions))
  console.log('[14] plane positions:', JSON.stringify(planePos[0].positions))

  // Round-trip: line
  const lp = linePos[0].positions[0]
  const lineRequery = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [lp.x, lp.y, lp.z] }],
  })
  const lineMatch = lineRequery.result.lines[0] === lineId
  console.log('[14] line round-trip:', lineRequery.result.lines[0], '=', lineId, '→', lineMatch)

  // Round-trip: point
  const pp = pointPos[0].positions[0]
  const pointRequery = await api.v1.part.getGeometryIds({
    id: partId,
    points: [{ pos: [pp.x, pp.y, pp.z] }],
  })
  const pointMatch = pointRequery.result.points[0] === pointId
  console.log('[14] point round-trip:', pointRequery.result.points[0], '=', pointId, '→', pointMatch)

  // Round-trip: plane (use the edge midpoints directly)
  const fp = planePos[0].positions.map(p => [p.x, p.y, p.z])
  const planeRequery = await api.v1.part.getGeometryIds({
    id: partId,
    planes: [{ positions: fp }],
  })
  const planeMatch = planeRequery.result.planes[0] === planeId
  console.log('[14] plane round-trip:', planeRequery.result.planes[0], '=', planeId, '→', planeMatch)

  filewrite({
    line: { id: lineId, positions: linePos[0].positions, refound: lineRequery.result.lines[0], match: lineMatch },
    point: { id: pointId, positions: pointPos[0].positions, refound: pointRequery.result.points[0], match: pointMatch },
    plane: { id: planeId, positions: planePos[0].positions, refound: planeRequery.result.planes[0], match: planeMatch },
  }, 'correct-roundtrip')

  return { partId }
}
