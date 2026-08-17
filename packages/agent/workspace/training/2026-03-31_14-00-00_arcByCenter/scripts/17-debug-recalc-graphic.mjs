// 17 — Debug: recalc graphic data after creating a rounded rectangle
// Mimicking what the renderer does
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ArcTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Profile' })).result

  // Simple test: one line + one arc
  await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0], endPos: [50, 0, 0] })
  await api.v1.curve.arcByCenter({
    id: shapeId, centerPos: [50, 10, 0], startPos: [50, 0, 0], endPos: [60, 10, 0], isClockwise: false,
  })
  await api.v1.curve.line({ id: shapeId, startPos: [60, 10, 0], endPos: [60, 40, 0] })

  // Now do what the renderer does: recalc
  const recalcR = await api.v1.common.recalc({})
  console.log('[17] recalc maxLevel:', recalcR.maxLevel)
  console.log('[17] recalc graphic?:', recalcR.graphic != null)
  console.log('[17] recalc containers?:', recalcR.graphic?.containers?.length)

  if (recalcR.graphic?.containers) {
    for (let i = 0; i < recalcR.graphic.containers.length; i++) {
      const c = recalcR.graphic.containers[i]
      console.log(`[17] container[${i}] type=${c.type} edges=${c.edges?.length || 0} meshes=${c.meshes?.length || 0}`)
      if (c.edges) {
        for (let j = 0; j < c.edges.length; j++) {
          const e = c.edges[j]
          const nVerts = (e.points?.length || 0) / 3
          console.log(`  edge[${j}] verts=${nVerts}`)
          if (e.points?.length >= 3) {
            const pts = []
            for (let k = 0; k < e.points.length; k += 3) {
              pts.push(`(${e.points[k].toFixed(1)},${e.points[k+1].toFixed(1)},${e.points[k+2].toFixed(1)})`)
            }
            console.log(`    points: ${pts.join(' -> ')}`)
          }
        }
      }
    }
    filewrite(recalcR.graphic, 'recalc-graphic')
  } else {
    console.log('[17] NO graphic data from recalc!')
  }

  // Also try a simpler shape: just a single arc
  const shapeId2 = (await api.v1.curve.shape({ id: eifId, name: 'SimpleArc' })).result
  await api.v1.curve.arcByCenter({
    id: shapeId2, centerPos: [0, 0, 0], startPos: [20, 0, 0], endPos: [0, 20, 0], isClockwise: false,
  })

  const recalcR2 = await api.v1.common.recalc({})
  console.log('[17b] recalc2 containers:', recalcR2.graphic?.containers?.length)
  if (recalcR2.graphic?.containers) {
    for (let i = 0; i < recalcR2.graphic.containers.length; i++) {
      const c = recalcR2.graphic.containers[i]
      console.log(`[17b] container[${i}] type=${c.type} edges=${c.edges?.length || 0}`)
      if (c.type === 2 && c.edges) {
        for (let j = 0; j < c.edges.length; j++) {
          const e = c.edges[j]
          const nVerts = (e.points?.length || 0) / 3
          console.log(`  edge[${j}] verts=${nVerts}`)
          if (e.points?.length >= 3) {
            // Just show first and last point
            console.log(`    first: (${e.points[0].toFixed(1)},${e.points[1].toFixed(1)},${e.points[2].toFixed(1)})`)
            const last = e.points.length - 3
            console.log(`    last: (${e.points[last].toFixed(1)},${e.points[last+1].toFixed(1)},${e.points[last+2].toFixed(1)})`)
          }
        }
      }
    }
    filewrite(recalcR2.graphic, 'recalc2-graphic')
  }

  await snapshot('debug')
  return { partId }
}
