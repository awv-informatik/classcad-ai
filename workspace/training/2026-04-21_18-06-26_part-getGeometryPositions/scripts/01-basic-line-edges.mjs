export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})

  // Get some edge IDs first using getGeometryIds
  const geoIds = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [
      { pos: [0, 0, 20] },   // front-left vertical edge
      { pos: [40, 0, 0] },   // front-bottom horizontal edge
      { pos: [80, 30, 0] },  // right-bottom horizontal edge
    ],
  })
  console.log('[01] getGeometryIds result:', JSON.stringify(geoIds.result))
  console.log('[01] getGeometryIds maxLevel:', geoIds.maxLevel)

  const edgeIds = geoIds.result.lines
  console.log('[01] edge IDs:', edgeIds)

  // Now call getGeometryPositions with those IDs
  const r = await api.v1.part.getGeometryPositions({ elems: edgeIds })
  console.log('[01] getGeometryPositions maxLevel:', r.maxLevel)
  console.log('[01] result count:', r.result.length)

  for (const item of r.result) {
    console.log('[01] id:', item.id, 'positions:', JSON.stringify(item.positions))
  }

  filewrite({
    edgeIds,
    geoPositionsResult: r.result,
    messages: r.messages,
    maxLevel: r.maxLevel,
  }, 'basic-line-edges')

  await snapshot('box')
  return { partId }
}
