export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  const cylId = (await api.v1.part.cylinder({ id: partId, diameter: 40, height: 50 })).result
  await api.v1.common.recalc({})

  // Get edges from both bodies
  const boxEdge = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [40, 60, 0] }],  // back-bottom edge of box
  })
  const cylCircle = await api.v1.part.getGeometryIds({
    id: partId,
    circles: [{ pos: [0, 0, 50] }],  // top circle of cylinder
  })

  const boxEdgeId = boxEdge.result.lines?.[0]
  const cylCircleId = cylCircle.result.circles?.[0]
  console.log('[18] box edge ID:', boxEdgeId, 'maxLevel:', boxEdge.maxLevel)
  console.log('[18] cyl circle ID:', cylCircleId, 'maxLevel:', cylCircle.maxLevel)

  const allIds = [boxEdgeId, cylCircleId].filter(Boolean)
  if (allIds.length > 0) {
    const r = await api.v1.part.getGeometryPositions({ elems: allIds })
    console.log('[18] maxLevel:', r.maxLevel)
    for (const item of r.result) {
      console.log('[18] id:', item.id, 'positions:', JSON.stringify(item.positions))
    }
    filewrite({ boxEdgeId, cylCircleId, result: r.result, maxLevel: r.maxLevel }, 'multi-body')
  }

  await snapshot('multi-body')
  return { partId }
}
