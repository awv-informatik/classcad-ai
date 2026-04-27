export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})

  // Get an edge to fillet
  const edgeResult = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [0, 0, 20] }],  // front-left vertical edge
  })
  const edgeId = edgeResult.result.lines[0]
  console.log('[10] edge to fillet:', edgeId)

  // Fillet the edge
  const filletId = (await api.v1.part.fillet({ id: partId, references: [edgeId], radius: 10 })).result
  console.log('[10] fillet feature:', filletId)
  await api.v1.common.recalc({})

  // After fillet, find arc edges created by the fillet
  const arcResult = await api.v1.part.getGeometryIds({
    id: partId,
    arcs: [{ pos: [5, 0, 20] }],  // point on the fillet arc (approx midpoint)
  })
  console.log('[10] arc IDs:', arcResult.result.arcs, 'maxLevel:', arcResult.maxLevel)

  // Also find the new cylindrical face from the fillet
  const cylFaceResult = await api.v1.part.getGeometryIds({
    id: partId,
    cylinders: [{ positions: [[5, 0, 20], [5, 0, 10]] }],
  })
  console.log('[10] cyl face IDs:', cylFaceResult.result.cylinders, 'maxLevel:', cylFaceResult.maxLevel)

  // Collect valid IDs
  const arcIds = arcResult.result.arcs?.filter(id => id) || []
  const cylIds = (cylFaceResult.result.cylinders || []).flat().filter(id => id)
  const allIds = [...arcIds, ...cylIds]
  console.log('[10] all IDs:', allIds)

  if (allIds.length > 0) {
    const r = await api.v1.part.getGeometryPositions({ elems: allIds })
    console.log('[10] maxLevel:', r.maxLevel)
    for (const item of r.result) {
      console.log('[10] id:', item.id, 'positions count:', item.positions.length)
      console.log('[10] positions:', JSON.stringify(item.positions))
    }
    filewrite({ arcIds, cylIds, result: r.result, maxLevel: r.maxLevel }, 'fillet-arcs')
  } else {
    console.log('[10] no valid IDs found - trying different positions')
    filewrite({ arcResult, cylFaceResult }, 'fillet-arcs-failed')
  }

  await snapshot('fillet')
  return { partId }
}
