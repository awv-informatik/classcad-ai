// 17 — Sequential fillets: re-enumerate edges after each fillet
// After a fillet, the brep is rebuilt and old edge IDs are invalid.
// Must use position-based lookup (getGeometryIds) or re-enumerate (getBrepGeometryByIndex).
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SeqFilletFix' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result

  // First fillet: find edge by position, fillet it
  const geo1 = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [40, -30, 0] }],  // right-front vertical edge midpoint
  })
  const edge1 = geo1.result?.lines?.[0]
  console.log('[17] first edge:', edge1)

  const r1 = await api.v1.solid.fillet({ id: eifId, radius: 5, geomIds: [edge1] })
  console.log('[17] fillet1 result:', r1.result, 'maxLevel:', r1.maxLevel)

  await snapshot('after-first')

  // Second fillet: re-find a different edge by position AFTER the first fillet
  // The left-front vertical edge midpoint is at (-40, -30, 0)
  const geo2 = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [-40, -30, 0] }],  // left-front vertical edge midpoint
  })
  const edge2 = geo2.result?.lines?.[0]
  console.log('[17] second edge (after re-enum):', edge2)

  const r2 = await api.v1.solid.fillet({ id: eifId, radius: 8, geomIds: [edge2] })
  console.log('[17] fillet2 result:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages?.length) {
    for (const m of r2.messages) console.log(`[17] msg: level=${m.level} "${m.message}"`)
  }
  filewrite({ fillet1: { edge: edge1, result: r1.result }, fillet2: { edge: edge2, result: r2.result, maxLevel: r2.maxLevel } }, 'seq-fix')

  await snapshot('after-both')

  return { partId, eifId, boxId }
}
