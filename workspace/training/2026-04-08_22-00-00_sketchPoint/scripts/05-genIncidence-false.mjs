// Test genIncidence=FALSE — two points at same position, NO auto-coincidence
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NoIncidenceTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create first point
  const r1 = await api.v1.sketch.point({ id: skId, pos: [30, 20, 0] })
  console.log('[05] first point — result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Create second point at same position with genIncidence=FALSE
  const r2 = await api.v1.sketch.point({ id: skId, pos: [30, 20, 0], genIncidence: 0 })
  console.log('[05] second point same pos, genIncidence=FALSE — result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite(r2.structure, 'structure-incidence-false')

  await snapshot('two-points-no-incidence')
  return { partId, skId }
}
