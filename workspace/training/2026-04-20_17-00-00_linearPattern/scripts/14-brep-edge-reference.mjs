export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BrepEdgeRef' })).result

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 60, width: 40, height: 30,
  })).result

  // Get a brep edge from the box to use as pattern direction
  const geoIds = (await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [60, 20, 30] }],
  })).result
  console.log('[14] geoIds:', JSON.stringify(geoIds))

  const edgeId = geoIds.lines?.[0]
  console.log('[14] edgeId:', edgeId)

  if (!edgeId) {
    console.log('[14] No edge found, trying different position')
    const geoIds2 = (await api.v1.part.getGeometryIds({
      id: partId,
      lines: [{ pos: [30, 0, 15] }],
    })).result
    console.log('[14] geoIds2:', JSON.stringify(geoIds2))
  }

  // Create a small cylinder to pattern (leave box as base)
  const wcs = (await api.v1.part.workCSys({
    id: partId, name: 'WCS1',
    origin: [10, 10, 30], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  const cylId = (await api.v1.part.cylinder({
    id: partId, name: 'Cyl1',
    height: 10, diameter: 8,
    references: [wcs],
  })).result

  if (edgeId) {
    // Try pattern using brep edge as direction reference
    const r = await api.v1.part.linearPattern({
      id: partId, name: 'LP_edge',
      targets: [cylId],
      dir1: { references: [edgeId], distance: 15, count: 4 },
    })
    console.log('[14] brep edge pattern result:', r.result, 'maxLevel:', r.maxLevel)
    console.log('[14] msgs:', JSON.stringify(r.messages))
    filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'brep-edge-response')
    await snapshot('brep-edge-pattern')
  }

  return { partId }
}
