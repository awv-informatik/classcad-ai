// Test referenceGeometry with arc and circle brep edges (from a cylinder)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ArcCircleRef' })).result

  // Create a cylinder to get arc/circle edges
  const cylId = (await api.v1.part.cylinder({
    id: partId, radius: 30, height: 50
  })).result
  console.log('[10] cylinderId:', cylId)

  // Get brep elements: top circle edge, bottom circle edge
  const geo = await api.v1.part.getGeometryIds({
    id: partId,
    circles: [
      { pos: [30, 0, 50] },  // top circle edge (z=50, on the circle at radius=30)
      { pos: [30, 0, 0] },   // bottom circle edge (z=0)
    ],
    planes: [
      { positions: [[0, 0, 50]] }  // top face
    ]
  })
  console.log('[10] brep IDs:', JSON.stringify(geo.result))
  filewrite(geo.result, 'brep-ids')

  const topCircleEdge = geo.result.circles ? geo.result.circles[0] : null
  const bottomCircleEdge = geo.result.circles ? geo.result.circles[1] : null
  const topFace = geo.result.planes[0]
  console.log('[10] topCircleEdge:', topCircleEdge, 'bottomCircleEdge:', bottomCircleEdge, 'topFace:', topFace)

  // Create sketch on the top face
  const skId = (await api.v1.sketch.create({ id: partId, name: 'CircleRefSketch', planeId: topFace })).result
  console.log('[10] sketchId:', skId)

  // Project the bottom circle edge into the top-face sketch
  if (bottomCircleEdge) {
    const r1 = await api.v1.sketch.referenceGeometry({ id: skId, brepIds: [bottomCircleEdge] })
    console.log('[10] refGeo circle edge — result:', r1.result, 'maxLevel:', r1.maxLevel)
    console.log('[10] refGeo circle messages:', JSON.stringify(r1.messages))
    filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'refgeo-circle')

    // Check what type of geometry was created
    const skGeo = await api.v1.sketch.getGeometry({ id: skId })
    console.log('[10] sketch geometry:', JSON.stringify(skGeo.result))
    filewrite(skGeo.result, 'sketch-geometry')
  }

  // Also project top circle edge (which is ON the sketch plane)
  if (topCircleEdge) {
    const r2 = await api.v1.sketch.referenceGeometry({ id: skId, brepIds: [topCircleEdge] })
    console.log('[10] refGeo top circle (on-plane) — result:', r2.result, 'maxLevel:', r2.maxLevel)
    console.log('[10] refGeo top circle messages:', JSON.stringify(r2.messages))
    filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'refgeo-top-circle')

    const skGeo2 = await api.v1.sketch.getGeometry({ id: skId })
    console.log('[10] sketch geometry after top circle:', JSON.stringify(skGeo2.result))
    filewrite(skGeo2.result, 'sketch-geometry-both')
  }

  await snapshot('circle-refs')
  return { partId }
}
