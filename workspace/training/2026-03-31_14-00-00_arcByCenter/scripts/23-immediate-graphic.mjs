// 23 — Debug: try sendGraphic_Immediately: true in Configuration
export default async function (api, { snapshot, filewrite }) {
  // Access the raw client to send a Configuration command
  // We can't do this through api.v1.* — need to use the low-level execute
  // But we CAN set doCurveTessellation before creating curves

  await api.v1.common.setDatabaseSettings({
    isGraphicEnabled: true, isCCGraphicEnabled: true, doCurveTessellation: true,
  })

  const partId = (await api.v1.part.create({ name: 'ArcTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Create shape1 with 1 line
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'S1' })).result
  const r1 = await api.v1.curve.line({ id: s1, startPos: [0, 0, 0], endPos: [50, 0, 0] })
  console.log('[23] s1 line graphic?:', r1.graphic != null)
  if (r1.graphic?.containers?.[0]?.edges) {
    for (const e of r1.graphic.containers[0].edges) {
      const nV = (e.points?.length || 0) / 3
      console.log(`  edge verts=${nV}`)
      if (e.points) {
        const pts = []
        for (let k = 0; k < e.points.length; k += 3) pts.push(`(${e.points[k]},${e.points[k+1]})`)
        console.log(`  points: ${pts.join(' -> ')}`)
      }
    }
  }
  filewrite(r1.graphic, 's1-line-graphic')

  // Now create shape2 with 1 arc — this should be a NEW shape, so first curve gets graphic
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'S2' })).result
  const r2 = await api.v1.curve.arcByCenter({
    id: s2, centerPos: [0, 50, 0], startPos: [20, 50, 0], endPos: [0, 70, 0], isClockwise: false,
  })
  console.log('[23] s2 arc graphic?:', r2.graphic != null)
  if (r2.graphic?.containers) {
    for (const c of r2.graphic.containers) {
      console.log(`  type=${c.type} edges=${c.edges?.length || 0}`)
      for (const e of (c.edges || [])) console.log(`    edge verts=${(e.points?.length || 0)/3}`)
    }
  }
  filewrite(r2.graphic, 's2-arc-graphic')

  // Key question: does s2's graphic contain s1's edges too?
  console.log('[23] s2 graphic container count:', r2.graphic?.containers?.length)

  await snapshot('two-shapes')
  return { partId }
}
