// Test: verify actual coordinates after transform using graphic edge data
// Use a single line for simplicity, then check graphic edge points
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'VerifyCoords' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S' })).result

  // Single line from (10, 5, 0) to (30, 5, 0)
  await api.v1.curve.line({ id: shapeId, startPos: [10, 5, 0], endPos: [30, 5, 0] })

  // Transform: translate +20 X, +10 Y
  const r1 = await api.v1.curve.transformShape({
    id: shapeId,
    matrix: [
      [1, 0, 0, 20],
      [0, 1, 0, 10],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ],
  })
  console.log('[19] translate +20x +10y:')
  console.log('  result:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.graphic && r1.graphic.containers) {
    for (const c of r1.graphic.containers) {
      if (c.edges) {
        for (const e of c.edges) {
          console.log('  edge points:', JSON.stringify(e.points))
          // Expected: [30, 15, 0, 50, 15, 0] (original + [20, 10, 0])
        }
      }
    }
  }
  filewrite(r1.graphic, 'after-translate-graphic')

  // Now rotate 90° Z (on top of the translation — cumulative test)
  const r2 = await api.v1.curve.transformShape({
    id: shapeId,
    matrix: [
      [0, -1, 0, 0],
      [1, 0, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ],
  })
  console.log('[19] then rotate 90° Z:')
  console.log('  result:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.graphic && r2.graphic.containers) {
    for (const c of r2.graphic.containers) {
      if (c.edges) {
        for (const e of c.edges) {
          console.log('  edge points:', JSON.stringify(e.points))
          // If cumulative: points (30,15,0) and (50,15,0) get rotated 90° around origin
          // Expected: [-15, 30, 0, -15, 50, 0]
        }
      }
    }
  }
  filewrite(r2.graphic, 'after-rotate-graphic')

  await snapshot('19-verify')

  return { partId }
}
