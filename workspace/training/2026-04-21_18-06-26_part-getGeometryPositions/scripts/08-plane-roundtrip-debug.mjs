export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})

  // Get front face ID
  const faceResult = await api.v1.part.getGeometryIds({
    id: partId,
    planes: [{ positions: [[40, 0, 20]] }],  // single point on front face
  })
  const faceId = faceResult.result.planes[0]
  console.log('[08] face ID:', faceId, 'maxLevel:', faceResult.maxLevel)

  // Get positions for this face
  const posResult = await api.v1.part.getGeometryPositions({ elems: [faceId] })
  const positions = posResult.result[0].positions
  console.log('[08] positions count:', positions.length)
  console.log('[08] positions:', JSON.stringify(positions))

  // Try round-trip with different subsets of positions
  const posArrays = positions.map(p => [p.x, p.y, p.z])

  // Test A: all 4 positions
  const ra = await api.v1.part.getGeometryIds({
    id: partId,
    planes: [{ positions: posArrays }],
  })
  console.log('[08] round-trip 4 positions:', ra.result.planes, 'maxLevel:', ra.maxLevel)

  // Test B: first 2 positions
  const rb = await api.v1.part.getGeometryIds({
    id: partId,
    planes: [{ positions: posArrays.slice(0, 2) }],
  })
  console.log('[08] round-trip 2 positions:', rb.result.planes, 'maxLevel:', rb.maxLevel)

  // Test C: just 1 position (first edge midpoint)
  const rc = await api.v1.part.getGeometryIds({
    id: partId,
    planes: [{ positions: [posArrays[0]] }],
  })
  console.log('[08] round-trip 1 position:', rc.result.planes, 'maxLevel:', rc.maxLevel)

  // Test D: try as lines instead — are these edge midpoints findable as lines?
  const rd = await api.v1.part.getGeometryIds({
    id: partId,
    lines: posArrays.map(p => ({ pos: p })),
  })
  console.log('[08] positions as lines:', rd.result.lines, 'maxLevel:', rd.maxLevel)

  filewrite({
    faceId,
    positions,
    roundTrip4: { result: ra.result, maxLevel: ra.maxLevel, messages: ra.messages },
    roundTrip2: { result: rb.result, maxLevel: rb.maxLevel, messages: rb.messages },
    roundTrip1: { result: rc.result, maxLevel: rc.maxLevel, messages: rc.messages },
    asLines: { result: rd.result, maxLevel: rd.maxLevel },
  }, 'plane-roundtrip-debug')

  return { partId }
}
