// 20 — Debug: does each arc graphic contain all curves in the shape, or just the new one?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ArcTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S1' })).result

  // Arc 1
  const r1 = await api.v1.curve.arcByCenter({
    id: shapeId, centerPos: [0, 0, 0], startPos: [20, 0, 0], endPos: [0, 20, 0], isClockwise: false,
  })
  console.log('[20] arc1: containers=' + r1.graphic?.containers?.length +
    ' edges=' + r1.graphic?.containers?.[0]?.edges?.length)

  // Arc 2
  const r2 = await api.v1.curve.arcByCenter({
    id: shapeId, centerPos: [40, 0, 0], startPos: [60, 0, 0], endPos: [40, 20, 0], isClockwise: false,
  })
  console.log('[20] arc2: containers=' + r2.graphic?.containers?.length +
    ' edges=' + r2.graphic?.containers?.[0]?.edges?.length)

  // Line (should have no graphic)
  const r3 = await api.v1.curve.line({ id: shapeId, startPos: [0, 20, 0], endPos: [40, 20, 0] })
  console.log('[20] line: graphic=' + (r3.graphic != null))

  // Arc 3
  const r4 = await api.v1.curve.arcByCenter({
    id: shapeId, centerPos: [80, 0, 0], startPos: [100, 0, 0], endPos: [80, 20, 0], isClockwise: false,
  })
  console.log('[20] arc3: containers=' + r4.graphic?.containers?.length +
    ' edges=' + r4.graphic?.containers?.[0]?.edges?.length)

  // Check: after arc3, does the graphic contain arc1 and arc2 edges too?
  if (r4.graphic?.containers) {
    for (let i = 0; i < r4.graphic.containers.length; i++) {
      const c = r4.graphic.containers[i]
      console.log(`[20] arc3 container[${i}] type=${c.type} edges=${c.edges?.length || 0}`)
      if (c.edges) {
        for (let j = 0; j < c.edges.length; j++) {
          const e = c.edges[j]
          const nV = (e.points?.length || 0) / 3
          const first = e.points ? `(${e.points[0].toFixed(1)},${e.points[1].toFixed(1)})` : '?'
          const last = e.points ? `(${e.points[e.points.length-3].toFixed(1)},${e.points[e.points.length-2].toFixed(1)})` : '?'
          console.log(`  edge[${j}] verts=${nV} ${first} -> ${last}`)
        }
      }
    }
  }

  filewrite(r4.graphic, 'arc3-graphic')

  await snapshot('cumulative-test')
  return { partId, shapeId }
}
