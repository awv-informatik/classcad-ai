export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'EdgeFeatTest' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 60, width: 40, height: 30 })).result

  // Find an edge for fillet
  const geoIds = (await api.v1.part.getGeometryIds({ id: partId, lines: [{ pos: [60, 0, 15] }] })).result
  console.log('[14] geoIds lines:', geoIds.lines)

  // Create fillet feature
  const filletId = (await api.v1.part.fillet({ id: partId, name: 'Fillet1', references: geoIds.lines, radius: 5 })).result
  console.log('[14] filletId:', filletId)

  // Find another edge for chamfer
  const geoIds2 = (await api.v1.part.getGeometryIds({ id: partId, lines: [{ pos: [0, 40, 15] }] })).result
  console.log('[14] geoIds2 lines:', geoIds2.lines)

  const chamferId = (await api.v1.part.chamfer({ id: partId, name: 'Chamfer1', references: geoIds2.lines, distance: 4 })).result
  console.log('[14] chamferId:', chamferId)

  await snapshot('before-color')

  // Color the fillet feature
  const r1 = await api.v1.part.setAppearance({ target: filletId, color: [255, 0, 0] })
  console.log('[14] fillet color:', r1.maxLevel)
  if (r1.messages?.length) console.log('[14] fillet msgs:', JSON.stringify(r1.messages))

  // Color the chamfer feature
  const r2 = await api.v1.part.setAppearance({ target: chamferId, color: [0, 255, 0] })
  console.log('[14] chamfer color:', r2.maxLevel)
  if (r2.messages?.length) console.log('[14] chamfer msgs:', JSON.stringify(r2.messages))

  await snapshot('after-color')

  filewrite({
    fillet: { maxLevel: r1.maxLevel, msgs: r1.messages },
    chamfer: { maxLevel: r2.maxLevel, msgs: r2.messages },
  }, 'edge-feat-results')

  return { partId }
}
