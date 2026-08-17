// 15 — Use getGeometryIds (position-based) to find edges, then fillet them
// This is the alternative to getBrepGeometryByIndex — find edges by position.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'PosBasedFillet' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  // Box 80x60x40 centered at origin
  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result

  // Find a specific edge by a point on it
  // The top-front-right vertical edge goes from (40, -30, -20) to (40, -30, 20)
  // Its midpoint is at (40, -30, 0)
  const geoR = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [
      { pos: [40, -30, 0] },  // midpoint of a vertical edge
      { pos: [0, -30, 20] },  // midpoint of a top horizontal edge
    ],
  })
  console.log('[15] getGeometryIds result lines:', JSON.stringify(geoR.result?.lines))
  console.log('[15] maxLevel:', geoR.maxLevel)
  filewrite(geoR.result, 'geometry-ids')

  const edgeIds = geoR.result?.lines || []
  console.log('[15] edge IDs found:', JSON.stringify(edgeIds))

  if (edgeIds.length > 0) {
    await snapshot('before')

    const r = await api.v1.solid.fillet({ id: eifId, radius: 6, geomIds: edgeIds })
    console.log('[15] fillet result:', r.result, 'maxLevel:', r.maxLevel)
    if (r.messages?.length) {
      for (const m of r.messages) console.log(`[15] msg: level=${m.level} "${m.message}"`)
    }
    filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'pos-fillet-response')

    await snapshot('after')
  }

  return { partId, eifId, boxId }
}
