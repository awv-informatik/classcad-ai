export default async function (api, { snapshot, filewrite }) {
  // Face lookup pattern: find faces for workPlane, combined with edge lookup for fillet
  const partId = (await api.v1.part.create({ name: 'FaceLookup' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})

  // Enumerate all faces
  const allFaces = []
  for (let i = 0; ; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: boxId, faceIndex: i })
    if (r.result === null) break
    allFaces.push(r.result)
  }
  console.log('[13] box faces:', allFaces.length)

  // Get positions for all faces
  const facePos = await api.v1.part.getGeometryPositions({ elems: allFaces })
  console.log('[13] face positions:')
  facePos.result?.forEach((f, i) => {
    console.log(`  face[${i}] id=${f.id} positions=${f.positions.length} first=[${f.positions[0].x.toFixed(0)},${f.positions[0].y.toFixed(0)},${f.positions[0].z.toFixed(0)}]`)
  })

  // Find the top face by position using planes
  const topFace = await api.v1.part.getGeometryIds({
    id: partId,
    planes: [{ positions: [[40, 30, 40]] }],  // center of top face
  })
  console.log('[13] top face (center):', topFace.result?.planes?.[0], 'maxLevel:', topFace.maxLevel)

  // Find the top face using edge midpoints (from getGeometryPositions data)
  // The top face has edges at [40,0,40], [80,30,40], [40,60,40], [0,30,40]
  const topFaceByEdges = await api.v1.part.getGeometryIds({
    id: partId,
    planes: [{ positions: [[40, 0, 40], [80, 30, 40]] }],  // 2 edge midpoints
  })
  console.log('[13] top face (2 edge midpoints):', topFaceByEdges.result?.planes?.[0], 'maxLevel:', topFaceByEdges.maxLevel)

  // Find cylindrical face on a cylinder
  const cylId = (await api.v1.part.cylinder({
    id: partId,
    diameter: 20,
    height: 30,
    position: [40, 30, 40],
    direction: [0, 0, 1],
  })).result
  const boolId = (await api.v1.part.boolean({
    id: partId,
    type: 'UNION',
    target: boxId,
    tools: [cylId],
  })).result
  await api.v1.common.recalc({})

  await snapshot('box-with-boss')

  // Find the cylindrical face
  const cylFace = await api.v1.part.getGeometryIds({
    id: partId,
    cylinders: [{ positions: [[50, 30, 55], [40, 40, 55]] }],  // 2 points on the cylinder surface
  })
  console.log('[13] cylindrical face:', cylFace.result?.cylinders?.[0], 'maxLevel:', cylFace.maxLevel)

  // Find the circle edges on the boss
  const bossCircles = await api.v1.part.getGeometryIds({
    id: partId,
    circles: [{ pos: [40, 30, 70] }],  // top of boss
    arcs: [{ pos: [40, 30, 40] }],  // base of boss (boolean junction)
  })
  console.log('[13] boss top circle:', bossCircles.result?.circles?.[0], 'maxLevel:', bossCircles.maxLevel)
  console.log('[13] boss base arc:', bossCircles.result?.arcs?.[0])

  // If we find the base circle/arc, fillet it
  const baseEdge = bossCircles.result?.circles?.[0] || bossCircles.result?.arcs?.[0]
  if (baseEdge && !Array.isArray(baseEdge)) {
    const filletId = (await api.v1.part.fillet({
      id: partId,
      references: [baseEdge],
      radius: 3,
    })).result
    console.log('[13] fillet boss base:', filletId != null ? '✓' : '❌')
    await snapshot('boss-filleted')
  }

  filewrite({
    faces: facePos.result?.map(f => ({ id: f.id, posCount: f.positions.length })),
    topFaceCenter: topFace.result,
    topFaceEdges: topFaceByEdges.result,
    cylFace: cylFace.result,
    bossCircles: bossCircles.result,
  }, 'face-lookup')

  return { partId }
}
