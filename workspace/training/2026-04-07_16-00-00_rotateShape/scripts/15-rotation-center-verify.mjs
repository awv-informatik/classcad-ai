// 15 — Verify rotation center numerically: rotate, then recalc to get final graphic edge coords
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CenterVerify' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Shape with a single line offset from origin: (20, 0, 0) → (30, 0, 0)
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Test' })).result
  await api.v1.curve.line({ id: shapeId, startPos: [20, 0, 0], endPos: [30, 0, 0] })

  // Rotate 90° CCW around Z BEFORE recalc/snapshot
  const r = await api.v1.curve.rotateShape({ id: shapeId, rotation: [0, 0, Math.PI / 2] })
  console.log('[15] rotateShape result:', r.result, 'maxLevel:', r.maxLevel)

  // Now recalc to get final graphic data with edges
  const rc = await api.v1.common.recalc({})

  // Extract edge data from graphic
  if (rc.graphic && rc.graphic.containers) {
    rc.graphic.containers.forEach((c, i) => {
      if (c.edges) {
        c.edges.forEach((e, j) => {
          const pts = e.points
          // points is flat [x1,y1,z1, x2,y2,z2, ...]
          const coords = []
          for (let k = 0; k < pts.length; k += 3) {
            coords.push([
              Math.round(pts[k] * 1000) / 1000,
              Math.round(pts[k+1] * 1000) / 1000,
              Math.round(pts[k+2] * 1000) / 1000,
            ])
          }
          console.log(`[15] container ${i} edge ${j}:`, JSON.stringify(coords))
        })
      }
    })
  }

  // If rotation is around ORIGIN:
  //   (20, 0, 0) → (0, 20, 0)
  //   (30, 0, 0) → (0, 30, 0)
  // If rotation is around shape center (25, 0, 0):
  //   (20, 0, 0) → (25, -5, 0)
  //   (30, 0, 0) → (25, 5, 0)
  console.log('[15] Expected if origin rotation: (0,20,0)→(0,30,0)')
  console.log('[15] Expected if center rotation: (25,-5,0)→(25,5,0)')

  filewrite(rc.graphic, 'recalc-graphic')

  await snapshot('after-rotation-recalc')

  return { partId }
}
