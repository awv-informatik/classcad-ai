// 04 — genIncidence: auto-coincidence when endpoints overlap existing geometry
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'IncTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a standalone point at (40, 0, 0)
  const ptR = await api.v1.sketch.point({ id: skId, pos: [40, 0, 0] })
  console.log('[04] point id:', ptR.result)

  // Create arc whose endPos is exactly at (40, 0, 0) — should auto-coinc with point
  const r1 = await api.v1.sketch.arcByCenter({
    id: skId,
    startPos: [-40, 0, 0],
    centerPos: [0, 0, 0],
    endPos: [40, 0, 0],
    genIncidence: true,  // default
  })
  console.log('[04] arc with genIncidence=true:', r1.result, 'maxLevel:', r1.maxLevel)

  // Create another arc with genIncidence=FALSE, endpoint at same point
  const r2 = await api.v1.sketch.arcByCenter({
    id: skId,
    startPos: [-40, -60, 0],
    centerPos: [0, -60, 0],
    endPos: [40, -60, 0],
    genIncidence: false,
  })
  console.log('[04] arc with genIncidence=false:', r2.result)

  // Also test: two arcs sharing an endpoint — does arc2 auto-coinc with arc1's endpoint?
  const r3 = await api.v1.sketch.arcByCenter({
    id: skId,
    startPos: [40, 0, 0],  // same as r1's endPos
    centerPos: [60, 0, 0],
    endPos: [80, 0, 0],
  })
  console.log('[04] arc sharing endpoint:', r3.result)

  filewrite(r3.structure, 'structure-incidence')

  await snapshot('genIncidence')
  return { partId }
}
