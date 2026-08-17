// 22 — Debug: set doCurveTessellation BEFORE creating curves
export default async function (api, { snapshot, filewrite }) {
  // Set tessellation FIRST
  await api.v1.common.setDatabaseSettings({
    isGraphicEnabled: true, isCCGraphicEnabled: true, doCurveTessellation: true,
  })

  const partId = (await api.v1.part.create({ name: 'ArcTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S1' })).result

  // Line 1
  const r1 = await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0], endPos: [50, 0, 0] })
  console.log('[22] line1 graphic?:', r1.graphic != null,
    r1.graphic?.containers?.length || 0, 'containers')

  // Arc 1
  const r2 = await api.v1.curve.arcByCenter({
    id: shapeId, centerPos: [50, 15, 0], startPos: [50, 0, 0], endPos: [65, 15, 0], isClockwise: false,
  })
  console.log('[22] arc1 graphic?:', r2.graphic != null,
    r2.graphic?.containers?.length || 0, 'containers')
  if (r2.graphic?.containers) {
    for (const c of r2.graphic.containers) {
      console.log(`  type=${c.type} edges=${c.edges?.length || 0}`)
      for (const e of (c.edges || [])) {
        console.log(`    edge verts=${(e.points?.length || 0)/3}`)
      }
    }
  }

  // Line 2
  const r3 = await api.v1.curve.line({ id: shapeId, startPos: [65, 15, 0], endPos: [65, 40, 0] })
  console.log('[22] line2 graphic?:', r3.graphic != null,
    r3.graphic?.containers?.length || 0, 'containers')

  // Arc 2
  const r4 = await api.v1.curve.arcByCenter({
    id: shapeId, centerPos: [50, 40, 0], startPos: [65, 40, 0], endPos: [50, 55, 0], isClockwise: false,
  })
  console.log('[22] arc2 graphic?:', r4.graphic != null,
    r4.graphic?.containers?.length || 0, 'containers')

  await snapshot('pre-tessellation')
  return { partId, shapeId }
}
