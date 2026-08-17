export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ChamferThenFillet' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result

  await api.v1.common.recalc({})

  // Chamfer the top-front edge
  const topFrontEdge = (await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [40, 0, 40] }],
  })).result.lines
  console.log('[12] chamfer edge:', JSON.stringify(topFrontEdge))

  const chamferR = await api.v1.part.chamfer({
    id: partId,
    name: 'Chamfer1',
    references: topFrontEdge,
    distance1: 10,
  })
  console.log('[12] chamfer result:', chamferR.result, 'maxLevel:', chamferR.maxLevel)

  await snapshot('after-chamfer')

  // Now fillet a different edge — bottom-front
  // Need new edge IDs after chamfer changed topology
  await api.v1.common.recalc({})
  const bottomFrontEdge = (await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [40, 0, 0] }],
  })).result.lines
  console.log('[12] fillet edge:', JSON.stringify(bottomFrontEdge))

  const filletR = await api.v1.part.fillet({
    id: partId,
    name: 'Fillet1',
    references: bottomFrontEdge,
    radius: 8,
  })
  console.log('[12] fillet result:', filletR.result, 'maxLevel:', filletR.maxLevel)
  if (filletR.messages?.length) console.log('[12] fillet messages:', JSON.stringify(filletR.messages))

  filewrite({
    chamfer: { result: chamferR.result, maxLevel: chamferR.maxLevel },
    fillet: { result: filletR.result, maxLevel: filletR.maxLevel },
  }, 'chamfer-then-fillet')

  await snapshot('after-fillet')

  return { partId, chamferId: chamferR.result, filletId: filletR.result }
}
