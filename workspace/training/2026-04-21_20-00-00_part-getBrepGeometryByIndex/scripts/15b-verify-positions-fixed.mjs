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

  // getGeometryPositions takes a single id at a time
  const edgeData = []
  for (const id of edgeIds) {
    const posR = await api.v1.part.getGeometryPositions({ id: partId, ids: [id] })
    edgeData.push({ id, result: posR.result, maxLevel: posR.maxLevel })
  }
  console.log(`[15b] got positions for ${edgeIds.length} edges`)

  filewrite(edgeData, 'edge-positions')
  return { partId }
}
