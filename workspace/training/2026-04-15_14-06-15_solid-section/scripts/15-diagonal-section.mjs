// 15 — Diagonal section (non-axis-aligned plane) through a box
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SectionDiagonal' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result

  // Diagonal plane: normal at 45° between X and Z
  const r = await api.v1.solid.section({
    id: eifId,
    target: boxId,
    originPos: [0, 0, 0],
    normal: [1, 0, 1],
  })

  console.log('[15] diagonal section result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite(r.graphic, 'graphic')

  const containers = r.graphic?.containers || []
  for (const c of containers) {
    if (c.edges) {
      console.log('[15] edges:', c.edges.length)
      console.log('[15] bbox min:', JSON.stringify(c.properties?.min))
      console.log('[15] bbox max:', JSON.stringify(c.properties?.max))
      for (const e of c.edges) {
        // Log first and last point of each edge
        const pts = e.points
        const n = pts.length / 3
        console.log(`[15]   edge ${e.id}: ${n} pts, start=[${pts[0]},${pts[1]},${pts[2]}], end=[${pts[n*3-3]},${pts[n*3-2]},${pts[n*3-1]}]`)
      }
    }
  }

  await snapshot('result')

  return { partId, eifId, boxId, sectionId: r.result }
}
