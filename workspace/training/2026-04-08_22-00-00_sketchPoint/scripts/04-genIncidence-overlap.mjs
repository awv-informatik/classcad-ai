// Test genIncidence — two points at the same position, should auto-coincidence
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'IncidenceTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create first point
  const r1 = await api.v1.sketch.point({ id: skId, pos: [30, 20, 0] })
  console.log('[04] first point — result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Create second point at same position with genIncidence=TRUE (default)
  const r2 = await api.v1.sketch.point({ id: skId, pos: [30, 20, 0] })
  console.log('[04] second point same pos, genIncidence=TRUE — result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite(r2.structure, 'structure-incidence-true')
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'response-incidence-true')

  await snapshot('two-points-same-pos')
  return { partId, skId }
}
