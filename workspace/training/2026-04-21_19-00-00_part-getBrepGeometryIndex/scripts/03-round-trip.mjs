export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})

  // Get some edge IDs
  const geoR = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [
      { pos: [0, 0, 20] },  // front-left vertical
      { pos: [40, 0, 0] },  // front bottom
    ],
    planes: [
      { positions: [[40, 0, 20]] }, // front face
    ],
  })

  const edgeIds = geoR.result.lines
  const faceIds = geoR.result.planes

  // Round-trip: getGeometryIds → getBrepGeometryIndex → getBrepGeometryByIndex → compare
  const roundTrips = []
  for (const edgeId of edgeIds) {
    // Step 1: get index
    const indexR = await api.v1.part.getBrepGeometryIndex({ id: boxId, geomId: edgeId })
    const idx = indexR.result
    // Step 2: get ID back from index
    const byIdxR = await api.v1.part.getBrepGeometryByIndex({ id: boxId, lineIndex: idx })
    const recoveredId = byIdxR.result
    const match = edgeId === recoveredId
    console.log('[03] edge', edgeId, '→ index', idx, '→ recovered', recoveredId, match ? '✓' : '❌')
    roundTrips.push({ type: 'line', originalId: edgeId, index: idx, recoveredId, match })
  }

  // Same for face
  for (const faceId of faceIds) {
    const indexR = await api.v1.part.getBrepGeometryIndex({ id: boxId, geomId: faceId })
    const idx = indexR.result
    const byIdxR = await api.v1.part.getBrepGeometryByIndex({ id: boxId, faceIndex: idx })
    const recoveredId = byIdxR.result
    const match = faceId === recoveredId
    console.log('[03] face', faceId, '→ index', idx, '→ recovered', recoveredId, match ? '✓' : '❌')
    roundTrips.push({ type: 'face', originalId: faceId, index: idx, recoveredId, match })
  }

  filewrite(roundTrips, 'round-trips')
  return { partId, boxId }
}
