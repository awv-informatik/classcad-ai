export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CylDebug' })).result
  const cylId = (await api.v1.part.cylinder({ id: partId, name: 'Cyl1', diameter: 40, height: 60 })).result
  await api.v1.common.recalc({})

  // Use getGeometryPositions to find what positions the server uses for brep elements
  // First, get the structure to find all brep element IDs
  const structR = await api.v1.part.getFeature({ id: cylId })
  filewrite(structR.result, 'cylinder-feature')

  // Try getGeometryPositions for the circles we found
  // From script 04, circle center found id 77
  const posR = await api.v1.part.getGeometryPositions({ elems: [77] })
  console.log('[06] circle 77 positions:', JSON.stringify(posR.result))

  // Cylindrical face — try with 2 positions (edge midpoints)
  // The cylinder surface touches: [20,0,30] [0,20,30] [-20,0,30] [0,-20,30]
  const r1 = await api.v1.part.getGeometryIds({
    id: partId,
    cylinders: [{ positions: [[20, 0, 30], [0, 20, 30]] }],
  })
  console.log('[06] cyl face (2 pts):', JSON.stringify(r1.result), 'maxLevel:', r1.maxLevel)

  // Try 3 positions on cylindrical face
  const r2 = await api.v1.part.getGeometryIds({
    id: partId,
    cylinders: [{ positions: [[20, 0, 30], [0, 20, 30], [-20, 0, 30]] }],
  })
  console.log('[06] cyl face (3 pts):', JSON.stringify(r2.result), 'maxLevel:', r2.maxLevel)

  // Try circle edge with points ON the rim at different angles
  const r3 = await api.v1.part.getGeometryIds({
    id: partId,
    circles: [{ pos: [0, 20, 60] }],  // 90 degrees around on top circle
  })
  console.log('[06] top circle [0,20,60]:', JSON.stringify(r3.result), 'maxLevel:', r3.maxLevel)

  const r4 = await api.v1.part.getGeometryIds({
    id: partId,
    circles: [{ pos: [-20, 0, 60] }],  // 180 degrees
  })
  console.log('[06] top circle [-20,0,60]:', JSON.stringify(r4.result), 'maxLevel:', r4.maxLevel)

  // Try circle at bottom center
  const r5 = await api.v1.part.getGeometryIds({
    id: partId,
    circles: [{ pos: [0, 0, 0] }],
  })
  console.log('[06] bottom circle center:', JSON.stringify(r5.result), 'maxLevel:', r5.maxLevel)

  filewrite({ cylFace2pts: r1, cylFace3pts: r2, circleOnRim: r3, circle180: r4, bottomCenter: r5 }, 'debug-results')

  await snapshot('cylinder-debug')
  return { partId }
}
