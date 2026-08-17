// 16 — Debug: dump the graphic data for a rounded rectangle to understand what the renderer sees
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ArcTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Profile' })).result

  // Rounded rectangle: 80 x 40 with r=10 corners
  const w = 80, h = 40, r = 10
  await api.v1.curve.line({ id: shapeId, startPos: [r, 0, 0], endPos: [w - r, 0, 0] })
  await api.v1.curve.arcByCenter({
    id: shapeId, centerPos: [w - r, r, 0], startPos: [w - r, 0, 0], endPos: [w, r, 0], isClockwise: false,
  })
  await api.v1.curve.line({ id: shapeId, startPos: [w, r, 0], endPos: [w, h - r, 0] })
  await api.v1.curve.arcByCenter({
    id: shapeId, centerPos: [w - r, h - r, 0], startPos: [w, h - r, 0], endPos: [w - r, h, 0], isClockwise: false,
  })
  await api.v1.curve.line({ id: shapeId, startPos: [w - r, h, 0], endPos: [r, h, 0] })
  await api.v1.curve.arcByCenter({
    id: shapeId, centerPos: [r, h - r, 0], startPos: [r, h, 0], endPos: [0, h - r, 0], isClockwise: false,
  })
  await api.v1.curve.line({ id: shapeId, startPos: [0, h - r, 0], endPos: [0, r, 0] })
  const lastR = await api.v1.curve.arcByCenter({
    id: shapeId, centerPos: [r, r, 0], startPos: [0, r, 0], endPos: [r, 0, 0], isClockwise: false,
  })

  // Dump the graphic data
  filewrite(lastR.graphic, 'graphic')

  // Also dump the structure
  filewrite(lastR.structure, 'structure')

  // Also try sendGraphic_Kernel explicitly
  const gk = await api.v1.common.sendGraphic_Kernel({ id: eifId })
  filewrite(gk.graphic, 'graphic-kernel')
  console.log('[16] graphic containers:', lastR.graphic?.containers?.length)
  console.log('[16] kernel graphic containers:', gk.graphic?.containers?.length)

  if (lastR.graphic?.containers) {
    for (let i = 0; i < lastR.graphic.containers.length; i++) {
      const c = lastR.graphic.containers[i]
      console.log(`[16] container[${i}] type=${c.type} edges=${c.edges?.length || 0}`)
      if (c.edges) {
        for (let j = 0; j < Math.min(c.edges.length, 5); j++) {
          const e = c.edges[j]
          console.log(`  edge[${j}] points=${e.points?.length || 0} (${e.points?.length/3} verts)`)
          // Show first few points
          if (e.points?.length >= 6) {
            console.log(`    first: [${e.points[0]}, ${e.points[1]}, ${e.points[2]}]`)
            console.log(`    last:  [${e.points[e.points.length-3]}, ${e.points[e.points.length-2]}, ${e.points[e.points.length-1]}]`)
          }
        }
      }
    }
  }

  if (gk.graphic?.containers) {
    for (let i = 0; i < gk.graphic.containers.length; i++) {
      const c = gk.graphic.containers[i]
      console.log(`[16] kernel container[${i}] type=${c.type} edges=${c.edges?.length || 0}`)
      if (c.edges) {
        for (let j = 0; j < Math.min(c.edges.length, 5); j++) {
          const e = c.edges[j]
          console.log(`  edge[${j}] points=${e.points?.length || 0} (${e.points?.length/3} verts)`)
          if (e.points?.length >= 6) {
            console.log(`    first: [${e.points[0]}, ${e.points[1]}, ${e.points[2]}]`)
            console.log(`    last:  [${e.points[e.points.length-3]}, ${e.points[e.points.length-2]}, ${e.points[e.points.length-1]}]`)
          }
        }
      }
    }
  }

  await snapshot('debug-rounded-rect')
  return { partId, shapeId }
}
