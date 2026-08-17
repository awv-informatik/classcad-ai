// Test where the scale center is — origin or shape center?
// Create shape offset from origin, scale 2x, check if coords double (origin center)
// or if shape stays centered (shape center)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ScaleCenter' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Shape 1: at origin — a line from (0,0) to (10,0)
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'AtOrigin' })).result
  await api.v1.curve.line({ id: s1, startPos: [0, 0, 0], endPos: [10, 0, 0] })

  // Shape 2: offset — a line from (50,50) to (60,50)
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'Offset' })).result
  await api.v1.curve.line({ id: s2, startPos: [50, 50, 0], endPos: [60, 50, 0] })

  await snapshot('before-scale-center-test')

  // Scale both by 3x
  const r1 = await api.v1.curve.scaleShape({ id: s1, factor: 3.0 })
  const r2 = await api.v1.curve.scaleShape({ id: s2, factor: 3.0 })
  console.log('[09] at-origin scale 3x:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[09] offset scale 3x:', r2.result, 'maxLevel:', r2.maxLevel)

  filewrite(r1.graphic, 'origin-shape-graphic')
  filewrite(r2.graphic, 'offset-shape-graphic')

  await snapshot('after-scale-center-test')

  // If scale center is origin:
  //   s1: (0,0)→(30,0) — just gets longer
  //   s2: (150,150)→(180,150) — moves away from origin AND gets longer
  // If scale center is shape center:
  //   s1: (-10,0)→(20,0) or similar — grows symmetrically
  //   s2: (45,50)→(75,50) — grows but stays centered around (55,50)

  return { partId }
}
