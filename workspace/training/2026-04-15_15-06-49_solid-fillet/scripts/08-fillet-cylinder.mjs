// 08 — Fillet on a cylinder's top/bottom circular edges
// Cylinder has arc edges, not line edges. Use arcIndex to find them.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CylFillet' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  const cylId = (await api.v1.solid.cylinder({ id: eifId, height: 60, diameter: 40 })).result
  console.log('[08] cylId:', cylId)

  // Enumerate line edges
  for (let i = 0; i < 5; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: eifId, lineIndex: i })
    console.log(`[08] lineIndex=${i}: result=${r.result}, maxLevel=${r.maxLevel}`)
  }

  // Enumerate arc edges — circle edges on top/bottom of cylinder
  for (let i = 0; i < 5; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: eifId, arcIndex: i })
    console.log(`[08] arcIndex=${i}: result=${r.result}, maxLevel=${r.maxLevel}`)
  }

  // Get the top circular edge (arcIndex=0 or 1)
  const arc0 = (await api.v1.part.getBrepGeometryByIndex({ id: eifId, arcIndex: 0 })).result
  const arc1 = (await api.v1.part.getBrepGeometryByIndex({ id: eifId, arcIndex: 1 })).result
  console.log('[08] arc0:', arc0, 'arc1:', arc1)

  // Get positions to identify which is top vs bottom
  if (arc0 && arc1) {
    const posR = await api.v1.part.getGeometryPositions({ elems: [arc0, arc1] })
    for (const e of posR.result) {
      console.log(`[08] arc ${e.id}: pos=${JSON.stringify(e.positions)}`)
    }
  }

  await snapshot('before')

  // Fillet both circular edges
  const edgesToFillet = [arc0, arc1].filter(Boolean)
  const r = await api.v1.solid.fillet({ id: eifId, radius: 8, geomIds: edgesToFillet })
  console.log('[08] fillet result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) {
    for (const m of r.messages) console.log(`[08] msg: level=${m.level} "${m.message}"`)
  }
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'cyl-fillet-response')

  await snapshot('after')

  return { partId, eifId, cylId }
}
