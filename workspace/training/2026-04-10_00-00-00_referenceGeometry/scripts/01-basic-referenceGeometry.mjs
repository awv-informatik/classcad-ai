// Test basic referenceGeometry — project box edges into a sketch
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RefGeoTest' })).result

  // Create a box to get brep edges
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  console.log('[01] boxId:', boxId)

  // Get brep edge IDs from known positions on the box
  // Top face edges: box is at origin, top face at z=40
  // A line edge on top face at midpoint: e.g. midpoint of top-front edge at [40, 0, 40]
  const geoIds = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [
      { pos: [40, 0, 40] },   // top-front edge (y=0, z=40)
      { pos: [0, 30, 40] },   // top-left edge (x=0, z=40)
      { pos: [80, 30, 40] },  // top-right edge (x=80, z=40)
    ],
    planes: [
      { positions: [[40, 30, 40]] }  // top face (z=40)
    ]
  })
  console.log('[01] getGeometryIds result:', JSON.stringify(geoIds.result))
  console.log('[01] getGeometryIds maxLevel:', geoIds.maxLevel)
  filewrite(geoIds.result, 'brep-ids')

  // Create a new sketch on the default XY plane
  const skId = (await api.v1.sketch.create({ id: partId, name: 'RefSketch' })).result
  console.log('[01] sketchId:', skId)

  // Project the top-front edge into the sketch
  const edgeIds = geoIds.result.lines
  console.log('[01] edge IDs to project:', edgeIds)

  if (edgeIds && edgeIds.length > 0) {
    const r = await api.v1.sketch.referenceGeometry({
      id: skId,
      brepIds: [edgeIds[0]]
    })
    console.log('[01] referenceGeometry result:', r.result)
    console.log('[01] referenceGeometry maxLevel:', r.maxLevel)
    console.log('[01] referenceGeometry messages:', JSON.stringify(r.messages))
    filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'refgeo-response')

    // Check what geometry is now in the sketch
    const geo = await api.v1.sketch.getGeometry({ id: skId })
    console.log('[01] sketch geometry after referenceGeometry:', JSON.stringify(geo.result))
    filewrite(geo.result, 'sketch-geometry')
  } else {
    console.log('[01] WARNING: no edge IDs found from getGeometryIds')
  }

  await snapshot('after-refgeo')
  return { partId, boxId, skId }
}
