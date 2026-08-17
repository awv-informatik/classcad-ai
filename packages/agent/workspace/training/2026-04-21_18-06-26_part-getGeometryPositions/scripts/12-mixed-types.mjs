export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})

  // Get various element types
  const geoIds = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [
      { pos: [0, 0, 20] },   // vertical edge
      { pos: [40, 0, 0] },   // bottom edge
    ],
    points: [
      { pos: [0, 0, 0] },    // origin vertex
      { pos: [80, 60, 40] },  // far corner vertex
    ],
    planes: [
      { positions: [[40, 0, 20]] },   // front face
      { positions: [[40, 30, 40]] },   // top face
    ],
  })

  const lineIds = geoIds.result.lines
  const pointIds = geoIds.result.points
  const planeIds = geoIds.result.planes
  console.log('[12] line IDs:', lineIds)
  console.log('[12] point IDs:', pointIds)
  console.log('[12] plane IDs:', planeIds)

  // Mix all types into one getGeometryPositions call
  const allIds = [...lineIds, ...pointIds, ...planeIds]
  console.log('[12] querying', allIds.length, 'elements of mixed types:', allIds)

  const r = await api.v1.part.getGeometryPositions({ elems: allIds })
  console.log('[12] maxLevel:', r.maxLevel)
  console.log('[12] result count:', r.result.length)

  for (let i = 0; i < r.result.length; i++) {
    const item = r.result[i]
    const type = i < 2 ? 'line' : i < 4 ? 'point' : 'plane'
    console.log('[12]', type, 'id:', item.id, 'positions count:', item.positions.length, 'positions:', JSON.stringify(item.positions))
  }

  // Verify ordering — result should match input order
  const inputIds = allIds
  const outputIds = r.result.map(item => item.id)
  console.log('[12] input order:', inputIds)
  console.log('[12] output order:', outputIds)
  console.log('[12] same order?', JSON.stringify(inputIds) === JSON.stringify(outputIds))

  filewrite({
    inputIds: allIds,
    outputIds,
    result: r.result,
    maxLevel: r.maxLevel,
    orderPreserved: JSON.stringify(inputIds) === JSON.stringify(outputIds),
  }, 'mixed-types')

  return { partId }
}
