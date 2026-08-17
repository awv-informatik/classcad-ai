// 18 — Debug: trace the exact graphic data flow during snapshot rendering
// Mimicking what the harness snapshot() + renderSession() does
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ArcTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S1' })).result

  // Create a simple arc
  const arcR = await api.v1.curve.arcByCenter({
    id: shapeId, centerPos: [0, 0, 0], startPos: [20, 0, 0], endPos: [0, 20, 0], isClockwise: false,
  })
  console.log('[18] arc graphic?:', arcR.graphic != null)
  if (arcR.graphic) {
    console.log('[18] arc graphic containers:', arcR.graphic.containers?.length)
    for (const c of (arcR.graphic.containers || [])) {
      console.log(`  type=${c.type} edges=${c.edges?.length || 0}`)
    }
  }

  // Now what the harness does: setDatabaseSettings
  const dbR = await api.v1.common.setDatabaseSettings({
    isGraphicEnabled: true, isCCGraphicEnabled: true, isSketchGraphicEnabled: true, doCurveTessellation: true,
  })
  console.log('[18] setDatabaseSettings graphic?:', dbR.graphic != null)
  if (dbR.graphic) {
    console.log('[18] dbSettings graphic containers:', dbR.graphic.containers?.length)
    for (const c of (dbR.graphic.containers || [])) {
      console.log(`  type=${c.type} edges=${c.edges?.length || 0}`)
      if (c.type === 2 && c.edges) {
        for (const e of c.edges) {
          console.log(`    edge verts=${(e.points?.length || 0)/3}`)
          if (e.points?.length >= 6) {
            console.log(`      first: (${e.points[0].toFixed(1)},${e.points[1].toFixed(1)},${e.points[2].toFixed(1)})`)
            const L = e.points.length
            console.log(`      last: (${e.points[L-3].toFixed(1)},${e.points[L-2].toFixed(1)},${e.points[L-1].toFixed(1)})`)
          }
        }
      }
    }
    filewrite(dbR.graphic, 'dbSettings-graphic')
  }

  // Now recalc (what renderSession does)
  const recalcR = await api.v1.common.recalc({})
  console.log('[18] recalc graphic?:', recalcR.graphic != null)
  if (recalcR.graphic) {
    console.log('[18] recalc containers:', recalcR.graphic.containers?.length)
    for (const c of (recalcR.graphic.containers || [])) {
      console.log(`  type=${c.type} edges=${c.edges?.length || 0}`)
    }
    filewrite(recalcR.graphic, 'recalc-graphic')
  }

  return { partId, shapeId }
}
