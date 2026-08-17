// Test referenceGeometry with multiple brep elements in one call, and different element types
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RefGeoMulti' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result

  // Get top face for sketch placement
  const geoFace = await api.v1.part.getGeometryIds({
    id: partId,
    planes: [{ positions: [[40, 30, 40]] }]
  })
  const topFaceId = geoFace.result.planes[0]

  // Get multiple edges, a vertex, and a face from the box
  const geo = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [
      { pos: [40, 0, 0] },   // bottom-front edge
      { pos: [40, 60, 0] },  // bottom-back edge
      { pos: [0, 0, 20] },   // left-front vertical edge
    ],
    points: [
      { pos: [0, 0, 0] },    // bottom-front-left vertex
      { pos: [80, 60, 40] },  // top-back-right vertex
    ],
    planes: [
      { positions: [[40, 0, 20]] }  // front face (y=0)
    ]
  })
  console.log('[05] brep IDs:', JSON.stringify(geo.result))
  filewrite(geo.result, 'brep-ids')

  const edges = geo.result.lines
  const vertices = geo.result.points
  const frontFace = geo.result.planes[0]
  console.log('[05] edges:', edges, 'vertices:', vertices, 'frontFace:', frontFace)

  // Create sketch on top face
  const skId = (await api.v1.sketch.create({ id: partId, name: 'MultiRefSketch', planeId: topFaceId })).result
  console.log('[05] sketchId:', skId)

  // Test 1: Multiple edges in one call
  const r1 = await api.v1.sketch.referenceGeometry({ id: skId, brepIds: edges })
  console.log('[05] refGeo 3 edges — result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'refgeo-3-edges')

  // Test 2: Vertices
  const r2 = await api.v1.sketch.referenceGeometry({ id: skId, brepIds: [vertices[0]] })
  console.log('[05] refGeo vertex — result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[05] refGeo vertex messages:', JSON.stringify(r2.messages))
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'refgeo-vertex')

  // Test 3: Face (plane)
  const r3 = await api.v1.sketch.referenceGeometry({ id: skId, brepIds: [frontFace] })
  console.log('[05] refGeo face — result:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[05] refGeo face messages:', JSON.stringify(r3.messages))
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'refgeo-face')

  // Test 4: Mixed — edge + vertex in one call
  const r4 = await api.v1.sketch.referenceGeometry({ id: skId, brepIds: [edges[0], vertices[1]] })
  console.log('[05] refGeo mixed (edge+vertex) — result:', r4.result, 'maxLevel:', r4.maxLevel)
  console.log('[05] refGeo mixed messages:', JSON.stringify(r4.messages))
  filewrite({ result: r4.result, messages: r4.messages, maxLevel: r4.maxLevel }, 'refgeo-mixed')

  // Check final sketch geometry
  const geo2 = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[05] final sketch geometry:', JSON.stringify(geo2.result))
  filewrite(geo2.result, 'sketch-geometry-final')

  await snapshot('after-multi')
  return { partId }
}
