// 21 — Debug: try various approaches to get full curve graphic after multiple creates
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ArcTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S1' })).result

  // Create line + arc + line (the problematic pattern)
  await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0], endPos: [50, 0, 0] })
  await api.v1.curve.arcByCenter({
    id: shapeId, centerPos: [50, 15, 0], startPos: [50, 0, 0], endPos: [65, 15, 0], isClockwise: false,
  })
  await api.v1.curve.line({ id: shapeId, startPos: [65, 15, 0], endPos: [65, 40, 0] })

  // At this point, lastGraphic only has the arc's graphic

  // Attempt 1: toggle isGraphicEnabled
  console.log('[21] === Attempt 1: toggle graphic off/on ===')
  await api.v1.common.setDatabaseSettings({ isGraphicEnabled: false })
  const r1 = await api.v1.common.setDatabaseSettings({ isGraphicEnabled: true, doCurveTessellation: true })
  console.log('  graphic?:', r1.graphic != null)
  if (r1.graphic) dumpGraphicSummary(r1.graphic, 'toggle')

  // Attempt 2: recalc after toggle
  console.log('[21] === Attempt 2: recalc after toggle ===')
  const r2 = await api.v1.common.recalc({})
  console.log('  graphic?:', r2.graphic != null)
  if (r2.graphic) dumpGraphicSummary(r2.graphic, 'recalc')

  // Attempt 3: setObjectName to "touch" the curve entity
  console.log('[21] === Attempt 3: touch curve entity via setObjectName ===')
  const r3 = await api.v1.common.setObjectName({ id: shapeId, name: 'S1-renamed' })
  console.log('  graphic?:', r3.graphic != null)
  if (r3.graphic) dumpGraphicSummary(r3.graphic, 'rename')

  // Attempt 4: deleteShape + recreate (nuclear option, for comparison)
  // Skip — too destructive

  // Attempt 5: call updateExpression on the part
  console.log('[21] === Attempt 5: updateExpression (force recalc) ===')
  try {
    const r5 = await api.v1.part.updateExpression({ id: partId, name: 'dummyExpr', value: '42' })
    console.log('  graphic?:', r5.graphic != null)
    if (r5.graphic) dumpGraphicSummary(r5.graphic, 'updateExpr')
  } catch (e) { console.log('  error:', e.message) }

  // Attempt 6: getDatabaseSettings to see current state
  console.log('[21] === Attempt 6: getDatabaseSettings ===')
  const r6 = await api.v1.common.getDatabaseSettings({})
  console.log('  doCurveTessellation:', r6.result?.doCurveTessellation)
  console.log('  isGraphicEnabled:', r6.result?.isGraphicEnabled)
  console.log('  graphic?:', r6.graphic != null)
  if (r6.graphic) dumpGraphicSummary(r6.graphic, 'getDbSettings')

  return { partId, shapeId }
}

function dumpGraphicSummary(graphic, label) {
  const containers = graphic.containers || []
  console.log(`  ${label}: ${containers.length} containers`)
  for (let i = 0; i < containers.length; i++) {
    const c = containers[i]
    console.log(`    c[${i}] type=${c.type} edges=${c.edges?.length || 0} meshes=${c.meshes?.length || 0}`)
    if (c.edges) {
      for (const e of c.edges) {
        console.log(`      edge verts=${(e.points?.length || 0)/3}`)
      }
    }
  }
}
