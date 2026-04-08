// Test genFixation=TRUE (default) — what constraints are auto-generated?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FixationTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a point with genFixation=TRUE (default)
  const r1 = await api.v1.sketch.point({ id: skId, pos: [30, 20, 0] })
  console.log('[02] point with default genFixation — result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Dump structure to see what constraints were generated
  filewrite(r1.structure, 'structure-genFixation-true')

  await snapshot('point-genFixation-true')
  return { partId, skId, pointId: r1.result }
}
