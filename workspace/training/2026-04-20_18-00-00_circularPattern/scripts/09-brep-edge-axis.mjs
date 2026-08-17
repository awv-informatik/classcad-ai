export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BrepEdgeAxis' })).result

  // Create a cylinder — its center axis is a natural rotation axis
  const cylId = (await api.v1.part.cylinder({
    id: partId, name: 'CenterCyl',
    height: 50, diameter: 15,
  })).result

  // Create a small box offset from center to pattern
  const boxId = (await api.v1.part.box({
    id: partId, name: 'SmallBox',
    length: 10, width: 8, height: 50,
    xPosition: 30, yPosition: -4, zPosition: 0,
  })).result

  // Get a vertical edge of the cylinder to use as rotation axis
  const geoIds = (await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [0, 7.5, 25] }], // on the vertical "seam" of the cylinder
  })).result
  console.log('[09] geoIds lines:', JSON.stringify(geoIds.lines))

  if (geoIds.lines?.length > 0) {
    const r1 = await api.v1.part.circularPattern({
      id: partId,
      name: 'CP_brepedge',
      targets: [boxId],
      references: [geoIds.lines[0]],
      angle: 1.0472, // 60 degrees
      count: 6,
    })
    console.log('[09] brep edge result:', r1.result, 'maxLevel:', r1.maxLevel)
    if (r1.messages?.length) {
      filewrite({ messages: r1.messages }, 'brep-edge-msgs')
    }
    await snapshot('brep-edge-pattern')
  } else {
    console.log('[09] No line edges found — trying circles')
    const circIds = geoIds.circles || []
    console.log('[09] geoIds circles:', JSON.stringify(circIds))
    filewrite(geoIds, 'brep-geoIds')
  }

  return { partId }
}
