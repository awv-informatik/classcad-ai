export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})

  // Get IDs from getBrepGeometryByIndex, then verify using getGeometryPositions
  const edgeIds = []
  for (let i = 0; i < 12; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: boxId, lineIndex: i })
    edgeIds.push(r.result)
  }

  // Get positions for all edges
  const posR = await api.v1.part.getGeometryPositions({ id: partId, ids: edgeIds })
  console.log(`[15] got positions for ${edgeIds.length} edges`)

  const edgeData = edgeIds.map((id, i) => ({
    index: i,
    id,
    positions: posR.result[i] || posR.result[id],
  }))

  filewrite(edgeData, 'edge-positions')

  // Also get face IDs and verify
  const faceIds = []
  for (let i = 0; i < 6; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: boxId, faceIndex: i })
    faceIds.push(r.result)
  }

  const facePosR = await api.v1.part.getGeometryPositions({ id: partId, ids: faceIds })
  console.log(`[15] got positions for ${faceIds.length} faces`)

  const faceData = faceIds.map((id, i) => ({
    index: i,
    id,
    positions: facePosR.result[i] || facePosR.result[id],
  }))

  filewrite(faceData, 'face-positions')
  await snapshot('box')
  return { partId }
}
