export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})

  // Pipeline: getBrepGeometryByIndex → getGeometryPositions → getGeometryIds → getBrepGeometryIndex
  const lineId = (await api.v1.part.getBrepGeometryByIndex({ id: boxId, lineIndex: 4 })).result
  console.log(`[17] lineIndex=4 → id=${lineId}`)

  // Get position
  const posR = await api.v1.part.getGeometryPositions({ elems: [lineId] })
  const pos = posR.result[0].positions[0]
  console.log(`[17] position: (${pos.x}, ${pos.y}, ${pos.z})`)

  // Re-find by position
  const geoR = await api.v1.part.getGeometryIds({ id: partId, lines: [{ pos: [pos.x, pos.y, pos.z] }] })
  const recoveredId = geoR.result.lines[0]
  console.log(`[17] re-found id: ${recoveredId} (match: ${recoveredId === lineId})`)

  // Get back to index
  const idxR = await api.v1.part.getBrepGeometryIndex({ id: boxId, geomId: recoveredId })
  console.log(`[17] back to index: ${idxR.result} (match: ${idxR.result === 4})`)

  // Also test with a face
  const faceId = (await api.v1.part.getBrepGeometryByIndex({ id: boxId, faceIndex: 2 })).result
  console.log(`[17] faceIndex=2 → id=${faceId}`)
  const facePosR = await api.v1.part.getGeometryPositions({ elems: [faceId] })
  const facePositions = facePosR.result[0].positions
  console.log(`[17] face has ${facePositions.length} positions`)

  // Re-find face by positions
  const planePos = facePositions.map(p => [p.x, p.y, p.z])
  const faceGeoR = await api.v1.part.getGeometryIds({ id: partId, planes: [{ positions: planePos }] })
  const recoveredFace = faceGeoR.result.planes[0]
  console.log(`[17] re-found face: ${recoveredFace} (match: ${recoveredFace === faceId})`)

  filewrite({
    lineRoundTrip: { index: 4, id: lineId, position: pos, recoveredId, recoveredIndex: idxR.result },
    faceRoundTrip: { index: 2, id: faceId, positions: facePositions, recoveredFace },
  }, 'full-pipeline')

  return { partId }
}
