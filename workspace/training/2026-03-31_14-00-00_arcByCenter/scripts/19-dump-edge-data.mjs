// 19 — Debug: dump actual edge point data from graphic for arc vs line+arc
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ArcTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S1' })).result

  // Create one arc alone
  const r1 = await api.v1.curve.arcByCenter({
    id: shapeId, centerPos: [0, 0, 0], startPos: [20, 0, 0], endPos: [0, 20, 0], isClockwise: false,
  })
  console.log('[19] === Single arc graphic ===')
  dumpGraphic(r1.graphic, 'arc')
  filewrite(r1.graphic, 'single-arc-graphic')

  // Now add a line — this changes the shape
  const r2 = await api.v1.curve.line({ id: shapeId, startPos: [0, 20, 0], endPos: [0, 0, 0] })
  console.log('[19] === After adding line ===')
  dumpGraphic(r2.graphic, 'line')
  filewrite(r2.graphic, 'arc-plus-line-graphic')

  // Now add another line
  const r3 = await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0], endPos: [20, 0, 0] })
  console.log('[19] === After adding second line ===')
  dumpGraphic(r3.graphic, 'line2')
  filewrite(r3.graphic, 'arc-plus-2lines-graphic')

  // Now try: setDatabaseSettings with tessellation, then recalc
  const dbR = await api.v1.common.setDatabaseSettings({
    isGraphicEnabled: true, isCCGraphicEnabled: true, isSketchGraphicEnabled: true, doCurveTessellation: true,
  })
  console.log('[19] === setDatabaseSettings graphic ===')
  console.log('  graphic?:', dbR.graphic != null, 'maxLevel:', dbR.maxLevel)

  const recalcR = await api.v1.common.recalc({})
  console.log('[19] === recalc graphic ===')
  console.log('  graphic?:', recalcR.graphic != null, 'maxLevel:', recalcR.maxLevel)
  if (recalcR.graphic) {
    dumpGraphic(recalcR.graphic, 'recalc')
    filewrite(recalcR.graphic, 'recalc-graphic')
  }

  // Try sendGraphic explicitly
  try {
    const sgR = await api.v1.common.sendGraphic({})
    console.log('[19] === sendGraphic ===')
    console.log('  graphic?:', sgR.graphic != null, 'maxLevel:', sgR.maxLevel)
    if (sgR.graphic) dumpGraphic(sgR.graphic, 'sendGraphic')
  } catch (e) {
    console.log('[19] sendGraphic error:', e.message)
  }

  return { partId, shapeId }
}

function dumpGraphic(graphic, label) {
  if (!graphic) { console.log(`  ${label}: no graphic`); return }
  const containers = graphic.containers || []
  console.log(`  ${label}: ${containers.length} containers`)
  for (let i = 0; i < containers.length; i++) {
    const c = containers[i]
    const edgeCount = c.edges?.length || 0
    console.log(`  container[${i}] type=${c.type} edges=${edgeCount}`)
    if (c.edges) {
      for (let j = 0; j < c.edges.length; j++) {
        const e = c.edges[j]
        const nVerts = (e.points?.length || 0) / 3
        console.log(`    edge[${j}] verts=${nVerts}`)
        // Show all points for small edges, first/last for big ones
        if (e.points) {
          const pts = []
          for (let k = 0; k < e.points.length; k += 3) {
            pts.push(`(${e.points[k].toFixed(2)},${e.points[k+1].toFixed(2)})`)
          }
          if (pts.length <= 10) {
            console.log(`      all: ${pts.join(' -> ')}`)
          } else {
            console.log(`      first3: ${pts.slice(0,3).join(' -> ')}`)
            console.log(`      last3:  ${pts.slice(-3).join(' -> ')}`)
          }
        }
      }
    }
  }
}
