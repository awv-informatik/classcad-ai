// 18 — Fillet on an extrusion solid (profile-based, non-primitive)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ExtrusionFillet' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  // Create an L-shaped profile
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'LProfile' })).result
  await api.v1.curve.advancedPolyline({
    id: shapeId,
    pld: [
      { xa: 0, ya: 0 },
      { xa: 60, ya: 0 },
      { xa: 60, ya: 20 },
      { xa: 20, ya: 20 },
      { xa: 20, ya: 50 },
      { xa: 0, ya: 50 },
    ],
    close: true,
  })

  // Extrude it
  const extId = (await api.v1.solid.extrusion({ id: eifId, direction: [0, 0, 30], curves: shapeId })).result
  console.log('[18] extId:', extId)

  // Enumerate edges — L-shape extrusion has more edges than a box
  const lines = []
  for (let i = 0; i < 30; i++) {
    const r = await api.v1.part.getBrepGeometryByIndex({ id: eifId, lineIndex: i })
    if (r.result && r.maxLevel <= 31) lines.push(r.result)
    else break
  }
  console.log('[18] line edges:', lines.length)

  // Find the inner corner edge (where the L-shape has a concave corner)
  // The concave corner is at (20, 20) in the profile → at z midpoint for the vertical edge
  const geoR = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [20, 20, 15] }],  // inner corner vertical edge midpoint
  })
  const innerEdge = geoR.result?.lines?.[0]
  console.log('[18] inner corner edge:', innerEdge)

  await snapshot('before')

  // Fillet the inner corner edge
  if (innerEdge) {
    const r = await api.v1.solid.fillet({ id: eifId, radius: 5, geomIds: [innerEdge] })
    console.log('[18] fillet result:', r.result, 'maxLevel:', r.maxLevel)
    if (r.messages?.length) {
      for (const m of r.messages) console.log(`[18] msg: level=${m.level} "${m.message}"`)
    }
    filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'extrusion-fillet')
  }

  await snapshot('after')

  return { partId, eifId }
}
