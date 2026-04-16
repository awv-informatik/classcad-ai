// 14 — Sequential fillets: fillet one edge, then fillet another edge on the same solid
// After the first fillet, edge IDs may change. Test if old IDs still work.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SeqFillet' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result

  // Get 2 edges before any fillet
  const edge0 = (await api.v1.part.getBrepGeometryByIndex({ id: eifId, lineIndex: 0 })).result
  const edge1 = (await api.v1.part.getBrepGeometryByIndex({ id: eifId, lineIndex: 1 })).result
  console.log('[14] edge0:', edge0, 'edge1:', edge1)

  // First fillet on edge0
  const r1 = await api.v1.solid.fillet({ id: eifId, radius: 5, geomIds: [edge0] })
  console.log('[14] fillet1 result:', r1.result, 'maxLevel:', r1.maxLevel)

  await snapshot('after-first-fillet')

  // Now try to fillet edge1 — does the ID still work after the first fillet changed the brep?
  const r2 = await api.v1.solid.fillet({ id: eifId, radius: 8, geomIds: [edge1] })
  console.log('[14] fillet2 result:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages?.length) {
    for (const m of r2.messages) console.log(`[14] msg2: level=${m.level} "${m.message}"`)
  }
  filewrite({ fillet1: { result: r1.result, maxLevel: r1.maxLevel }, fillet2: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages } }, 'sequential-fillet')

  await snapshot('after-second-fillet')

  return { partId, eifId, boxId }
}
